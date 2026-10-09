"""
Builds the intro write-on: a smoothed wordmark outline plus the mask strokes
that write it, with their timeline.

One-off asset generation, not a build step — the outputs are committed. Re-run
only when the wordmark or the stroke plan changes:

    pip install svgpathtools
    python scripts/make-intro.py --outline [debug-dir]   # once: smooth the trace
    python scripts/make-intro.py [debug-dir]             # strokes + timeline only

Outputs:
    public/assets/utsah-wordmark.svg   smoothed outline (header + intro)
    components/intro/wordmark-d.ts     the same path, for the server component
    components/intro/strokes.ts        mask strokes and their territories
    components/intro/timeline.ts       the intro's timeline constants

The source of truth for the GEOMETRY is utsah-wordmark.svg itself. --outline
reads it, smooths it and writes it back; it has been run once already, so only
pass it again if the SVG is replaced with a fresh (lumpy) trace. Pass a debug
dir to get a stroke/territory overlay and a contact sheet of the write-on.
"""

import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import dijkstra
from scipy.spatial import cKDTree
from skimage.measure import approximate_polygon, find_contours
from skimage.morphology import disk, skeletonize
from skimage.segmentation import watershed
from svgpathtools import parse_path

ROOT = Path(__file__).resolve().parent.parent
SVG = ROOT / 'public' / 'assets' / 'utsah-wordmark.svg'
WORDMARK_TS = ROOT / 'components' / 'intro' / 'wordmark-d.ts'
STROKES_TS = ROOT / 'components' / 'intro' / 'strokes.ts'
TIMELINE_TS = ROOT / 'components' / 'intro' / 'timeline.ts'

VW, VH = 2316, 1020
FILL = '#FF2116'

# Outline smoothing, all in viewBox units.
OUTLINE_SCALE = 4  # raster supersampling for contour extraction
SAMPLE = 0.5  # arc-length resampling step
SIGMA = 10.0  # potrace wobble from the 6x upscale has a 10-25 unit wavelength
CORNER_CHORD = 7.0  # chord either side when measuring turning angle
CORNER_DEG = 42.0  # sharper than this stays a corner (nib edges, bar ends)
FIT_TOL = 0.45  # max deviation of the fitted cubics from the smoothed contour
MAX_AREA_DRIFT = 0.015

# Strokes.
GRID = 2  # raster scale for skeleton, widths and territories
SEG_LEN = 220  # pen strokes are cut into segments about this long, one territory each
CENTER_SIGMA = 7.0  # smoothing of the skeleton walk
WIDTH_PAD = 8  # on top of 2x the farthest owned pixel
GHOST = 60  # straight run past a free tip, so its corners ink at touchdown
EASE_POINTS = 11  # samples in each segment's linear() easing
TERRITORY_GROW = 3  # territories overlap by this much so no seam shows mid-write
CLIP_TOL = 2.0  # clip polygons only have to contain their territory
MAX_UNCOVERED = 0.003

# Pen model. Speed falls on tight curves (the two-thirds power law of handwriting,
# v ~ curvature^-1/3, softened by CURVE_R so straights don't run away), and each
# stroke starts and lands softly: wall time is a blend of minimum-jerk and linear.
CURVE_R = 40.0
ENDS_SOFT = 0.6
DUR_EXP = 0.85  # duration ~ length^0.85: long strokes take longer, not proportionally
MIN_DUR = 110

# Timeline (ms). Left bars open, the word is written, right bars close it.
BARS_IN = (0, 380)
WORD = (220, 2450)
BARS_OUT = (2400, 2650)
BAR_STAGGER = 70
GAP_LIFT = 30  # pen lifted within a glyph
GAP_GLYPH = 60  # moving to the next glyph
SETTLE = 200  # stroke-assembled ink crossfades to the single clean fill
LIFT = 380  # mark lifts and fades before the curtain
CURTAIN_LAG = 80
CURTAIN = 650
# The curtain is three stacked panels (white, gold, red, as the mobile menu's
# pre-layers) leaving one after another, each this much behind the last.
LAYER_STAGGER = 90
LAYERS = 3

# The stroke plan: one entry per pen stroke, in writing order and direction.
# Waypoints are viewBox coords on (or near) the letter's spine; consecutive
# waypoints are joined along the skeleton. `ext` extends a free end out to the
# tapered tip; a stroke that starts or stops inside another (a cusp, a junction)
# sets it False. `after` is the pause before it: 'join' continues a cusp with no
# lift, 'lift' within a glyph, 'glyph' to a new letter.
PLAN = [
    # || (left) — drawn together, the setup
    dict(part='bars-in', pts=[(15, 215), (25, 560), (45, 640)]),
    dict(part='bars-in', pts=[(100, 205), (115, 560), (135, 640)]),
    # ઉ — one stroke: head, round the eye, lower bowl, out into the swash
    dict(part='word', after='glyph', pts=[
        (462, 207), (640, 285), (665, 400), (600, 462), (506, 438), (502, 372),
        (600, 400), (655, 490), (690, 600), (600, 680), (450, 640), (300, 400),
        (290, 250), (360, 80), (560, 65), (715, 180)]),
    # ત્
    dict(part='word', after='glyph', pts=[
        (1028, 385), (900, 350), (810, 395), (795, 470), (830, 550), (890, 575), (955, 605)]),
    # સ — hook and diagonal into the nose, then (cusp) the long descender
    dict(part='word', after='glyph', pts=[
        (1055, 335), (1075, 245), (1160, 255), (1185, 350), (1100, 420), (1045, 455), (982, 447)]),
    dict(part='word', after='join', ext=(False, True), pts=[
        (1045, 458), (1050, 500), (1100, 555), (1250, 700), (1300, 860), (1265, 935)]),
    # સ — crossbar, then headline and stem
    dict(part='word', after='lift', ext=(True, False), pts=[(1255, 428), (1300, 437), (1405, 420)]),
    dict(part='word', after='lift', pts=[(1255, 203), (1355, 240), (1415, 280), (1418, 450), (1420, 640)]),
    # ા
    dict(part='word', after='glyph', pts=[(1515, 203), (1600, 245), (1615, 290), (1615, 560), (1620, 655)]),
    # હ — the upper S, then (cusp) the big lower hook
    dict(part='word', after='glyph', ext=(True, False), pts=[
        (1905, 312), (1912, 250), (1850, 238), (1785, 268), (1772, 340), (1800, 382),
        (1880, 382), (1960, 392), (1990, 460), (1985, 540), (1950, 590), (1880, 605),
        (1810, 570), (1770, 515), (1722, 492)]),
    dict(part='word', after='join', pts=[
        (1716, 482), (1712, 600), (1745, 720), (1850, 850), (2000, 930), (2140, 935),
        (2200, 860), (2160, 690)]),
    # || (right) — the resolution
    dict(part='bars-out', pts=[(2185, 205), (2195, 560), (2213, 640)]),
    dict(part='bars-out', pts=[(2275, 205), (2285, 560), (2305, 640)]),
]


# ---------------------------------------------------------------- raster ----

def rasterise(d: str, scale: float) -> np.ndarray:
    """Even-odd fill of a path, as XOR of its subpath polygons."""
    w, h = int(VW * scale), int(VH * scale)
    acc = np.zeros((h, w), bool)
    for sub in parse_path(d).continuous_subpaths():
        pts = []
        for seg in sub:
            n = max(2, int(seg.length() * scale / 1.5))
            pts += [(z.real * scale, z.imag * scale) for z in seg.point(np.linspace(0, 1, n, endpoint=False))]
        im = Image.new('1', (w, h), 0)
        ImageDraw.Draw(im).polygon(pts, fill=1)
        acc ^= np.asarray(im)
    return acc


# --------------------------------------------------------------- outline ----

def resample(pts: np.ndarray, step: float, closed: bool) -> np.ndarray:
    if closed:
        pts = np.vstack([pts, pts[:1]])
    seg = np.hypot(*np.diff(pts, axis=0).T)
    s = np.concatenate([[0], np.cumsum(seg)])
    n = max(4, int(round(s[-1] / step)))
    t = np.linspace(0, s[-1], n, endpoint=not closed)
    return np.column_stack([np.interp(t, s, pts[:, 0]), np.interp(t, s, pts[:, 1])])


def turning(pts: np.ndarray, k: int) -> np.ndarray:
    """Turning angle (deg) at each point of a closed loop, over a k-sample chord."""
    a = pts - np.roll(pts, k, axis=0)
    b = np.roll(pts, -k, axis=0) - pts
    cos = (a * b).sum(1) / (np.hypot(*a.T) * np.hypot(*b.T) + 1e-9)
    return np.degrees(np.arccos(np.clip(cos, -1, 1)))


def gauss_open(pts: np.ndarray, sigma: float) -> np.ndarray:
    """Gaussian along an open run with both ends pinned (odd reflection)."""
    if len(pts) < 5:
        return pts.copy()
    pad = min(len(pts) - 1, int(3 * sigma) + 1)
    head = 2 * pts[0] - pts[pad:0:-1]
    tail = 2 * pts[-1] - pts[-2:-pad - 2:-1]
    ext = np.vstack([head, pts, tail])
    out = ndimage.gaussian_filter1d(ext, sigma, axis=0, mode='nearest')
    return out[pad:pad + len(pts)]


def gauss_closed(pts: np.ndarray, sigma: float) -> np.ndarray:
    return ndimage.gaussian_filter1d(pts, sigma, axis=0, mode='wrap')


def smooth_loop(pts: np.ndarray) -> list[tuple[np.ndarray, bool]]:
    """Returns the loop as runs between corners: [(points, is_closed_loop)]."""
    pts = resample(pts, SAMPLE, closed=True)
    sig = SIGMA / SAMPLE
    k = int(CORNER_CHORD / SAMPLE)
    ang = turning(pts, k)
    # Corners: local maxima above threshold, at least 2k apart.
    cand = np.flatnonzero((ang > CORNER_DEG) & (ang >= np.roll(ang, 1)) & (ang >= np.roll(ang, -1)))
    corners = []
    for i in sorted(cand, key=lambda i: -ang[i]):
        if all(min(abs(i - j), len(pts) - abs(i - j)) > 2 * k for j in corners):
            corners.append(i)
    corners.sort()

    # Taubin-style correction: 2G(x) - G(G(x)) cancels most of the shrinkage a
    # plain Gaussian puts on tight curves, so hairlines keep their weight.
    if not corners:
        g = gauss_closed(pts, sig)
        return [(2 * g - gauss_closed(g, sig), True)]
    runs = []
    for a, b in zip(corners, corners[1:] + [corners[0] + len(pts)]):
        run = np.take(pts, range(a, b + 1), axis=0, mode='wrap')
        g = gauss_open(run, sig)
        runs.append((2 * g - gauss_open(g, sig), False))
    return runs


# Schneider, "An Algorithm for Automatically Fitting Digitized Curves" (1990).

def _bez(ctrl, t):
    t = t[:, None]
    mt = 1 - t
    return mt**3 * ctrl[0] + 3 * mt**2 * t * ctrl[1] + 3 * mt * t**2 * ctrl[2] + t**3 * ctrl[3]


def _bez_d(ctrl, t):
    t = t[:, None]
    mt = 1 - t
    return 3 * mt**2 * (ctrl[1] - ctrl[0]) + 6 * mt * t * (ctrl[2] - ctrl[1]) + 3 * t**2 * (ctrl[3] - ctrl[2])


def _bez_dd(ctrl, t):
    t = t[:, None]
    return 6 * (1 - t) * (ctrl[2] - 2 * ctrl[1] + ctrl[0]) + 6 * t * (ctrl[3] - 2 * ctrl[2] + ctrl[1])


def _unit(v):
    n = np.hypot(*v)
    return v / n if n > 1e-9 else v


def _chord_params(pts):
    d = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(pts, axis=0).T))])
    return d / d[-1] if d[-1] > 0 else d


def _generate(pts, u, t1, t2):
    p0, p3 = pts[0], pts[-1]
    a1 = np.outer(3 * (1 - u) ** 2 * u, t1)
    a2 = np.outer(3 * (1 - u) * u**2, t2)
    c = np.array([[(a1 * a1).sum(), (a1 * a2).sum()], [(a1 * a2).sum(), (a2 * a2).sum()]])
    base = _bez(np.array([p0, p0, p3, p3]), u)
    tmp = pts - base
    x = np.array([(a1 * tmp).sum(), (a2 * tmp).sum()])
    det = c[0, 0] * c[1, 1] - c[0, 1] ** 2
    seg = np.hypot(*(p3 - p0))
    if abs(det) > 1e-12:
        al = (x[0] * c[1, 1] - c[0, 1] * x[1]) / det
        ar = (c[0, 0] * x[1] - c[0, 1] * x[0]) / det
    else:
        al = ar = seg / 3
    if al < 1e-6 * seg or ar < 1e-6 * seg:
        al = ar = seg / 3
    return np.array([p0, p0 + al * t1, p3 + ar * t2, p3])


def _reparam(ctrl, pts, u):
    q = _bez(ctrl, u) - pts
    d1, d2 = _bez_d(ctrl, u), _bez_dd(ctrl, u)
    num = (q * d1).sum(1)
    den = (d1 * d1).sum(1) + (q * d2).sum(1)
    out = u - np.where(np.abs(den) > 1e-12, num / den, 0)
    return np.clip(out, 0, 1)


def fit_cubics(pts, t1, t2, tol) -> list[np.ndarray]:
    if len(pts) == 2:
        dist = np.hypot(*(pts[1] - pts[0])) / 3
        return [np.array([pts[0], pts[0] + t1 * dist, pts[1] + t2 * dist, pts[1]])]
    u = _chord_params(pts)
    ctrl = _generate(pts, u, t1, t2)
    for _ in range(20):
        err = np.hypot(*(_bez(ctrl, u) - pts).T)
        split = int(np.argmax(err))
        if err[split] <= tol:
            return [ctrl]
        u = _reparam(ctrl, pts, u)
        ctrl = _generate(pts, u, t1, t2)
    err = np.hypot(*(_bez(ctrl, u) - pts).T)
    if err.max() <= tol:
        return [ctrl]
    split = int(np.clip(np.argmax(err), 1, len(pts) - 2))
    tc = _unit(pts[split - 1] - pts[split + 1])
    return fit_cubics(pts[:split + 1], t1, tc, tol) + fit_cubics(pts[split:], -tc, t2, tol)


def fit_run(run: np.ndarray, closed: bool, tol: float) -> list[np.ndarray]:
    """Fits one run. A closed loop starts at its flattest point with a shared tangent."""
    step = 4  # ~2 units: Schneider wants a sparse-ish polyline
    if closed:
        n = len(run)
        k = int(CORNER_CHORD / SAMPLE)
        start = int(np.argmin(turning(run, k)))
        run = np.roll(run, -start, axis=0)
        pts = np.vstack([run[::step], run[:1]])
        t = _unit(run[1] - run[-1])
        return fit_cubics(pts, t, -t, tol)
    pts = run[::step]
    if np.hypot(*(pts[-1] - run[-1])) > 1e-6:
        pts = np.vstack([pts, run[-1:]])
    if len(pts) < 3:
        pts = run
    k = min(len(pts) - 1, 3)
    return fit_cubics(pts, _unit(pts[k] - pts[0]), _unit(pts[-1 - k] - pts[-1]), tol)


def fmt(v: float) -> str:
    s = f'{v:.1f}'.rstrip('0').rstrip('.')
    if s in ('-0', ''):
        s = '0'
    return s.replace('0.', '.', 1) if s.startswith('0.') else s.replace('-0.', '-.', 1)


def to_path(loops: list[list[np.ndarray]]) -> str:
    """Relative cubic path, rounded to 0.1 with no drift (deltas of rounded abs)."""
    parts = []
    for cubics in loops:
        r = lambda p: np.round(p, 1)
        cur = r(cubics[0][0])
        parts.append(f'M{fmt(cur[0])} {fmt(cur[1])}c')
        nums = []
        for c in cubics:
            a, b, e = r(c[1]), r(c[2]), r(c[3])
            nums += [*(a - cur), *(b - cur), *(e - cur)]
            cur = e
        parts.append(' '.join(fmt(v) for v in nums).replace(' -', '-') + 'z')
    return ''.join(parts)


def smooth_outline(d: str) -> str:
    img = rasterise(d, OUTLINE_SCALE)
    loops = []
    # Pad so contours along the canvas edge (the left bar touches x=0) close.
    padded = np.pad(img, 2).astype(float)
    for c in find_contours(padded, 0.5):
        pts = (c[:, ::-1] - 2) / OUTLINE_SCALE  # (row, col) -> (x, y) in units
        if len(pts) < 20:
            continue
        cubics = []
        for run, closed in smooth_loop(pts):
            cubics += fit_run(run, closed, FIT_TOL)
        loops.append(cubics)
    return to_path(loops)


# --------------------------------------------------------------- strokes ----

def skeleton_graph(mask: np.ndarray):
    """8-connected skeleton as a sparse graph, plus a KD-tree to snap waypoints."""
    sk = skeletonize(mask)
    ys, xs = np.nonzero(sk)
    idx = -np.ones(mask.shape, np.int64)
    idx[ys, xs] = np.arange(len(ys))
    rows, cols, wts = [], [], []
    for dy, dx in [(0, 1), (1, -1), (1, 0), (1, 1)]:
        y2, x2 = ys + dy, xs + dx
        ok = (y2 < mask.shape[0]) & (x2 >= 0) & (x2 < mask.shape[1])
        a = np.flatnonzero(ok)
        b = idx[y2[ok], x2[ok]]
        hit = b >= 0
        rows += [a[hit], b[hit]]
        cols += [b[hit], a[hit]]
        wts += [np.full(hit.sum(), np.hypot(dy, dx))] * 2
    g = coo_matrix((np.concatenate(wts), (np.concatenate(rows), np.concatenate(cols))), shape=(len(ys),) * 2)
    return g.tocsr(), np.column_stack([xs, ys]).astype(float), cKDTree(np.column_stack([xs, ys]))


def sample_dt(dt: np.ndarray, p) -> float:
    x, y = int(round(p[0] * GRID)), int(round(p[1] * GRID))
    if 0 <= y < dt.shape[0] and 0 <= x < dt.shape[1]:
        return dt[y, x]
    return 0.0


def extend(line: np.ndarray, dt: np.ndarray, at_end: bool) -> tuple[np.ndarray, int]:
    """Runs a free end out along its tangent to the tapered tip, then GHOST units
    on past it. Returns the line and how many samples of it are ghost."""
    p = line[-1] if at_end else line[0]
    q = line[-12] if at_end else line[11]
    d = _unit(p - q)
    i = 1
    while i < 240 and sample_dt(dt, p + d * i) >= 0.75:
        i += 1
    ext = p + d[None] * np.arange(1, i + GHOST + 1)[:, None]
    return (np.vstack([line, ext]) if at_end else np.vstack([ext[::-1], line])), GHOST


def centerline(stroke: dict, graph, nodes_xy, tree, dt) -> tuple[np.ndarray, int, int]:
    """Spine of one pen stroke, 1 unit per sample, plus its ghost sample counts."""
    snaps = [tree.query(np.array(p, float) * GRID)[1] for p in stroke['pts']]
    path = [snaps[0]]
    for a, b in zip(snaps, snaps[1:]):
        _, pred = dijkstra(graph, indices=a, return_predecessors=True)
        leg, n = [], b
        while n != a:
            assert n >= 0, f'waypoints not connected on the skeleton: {stroke["pts"]}'
            leg.append(n)
            n = pred[n]
        path += leg[::-1]
    line = resample(nodes_xy[path] / GRID, 1.0, closed=False)
    g = gauss_open(line, CENTER_SIGMA)
    line = 2 * g - gauss_open(g, CENTER_SIGMA)
    ext = stroke.get('ext', (True, True))
    head = tail = 0
    if ext[0]:
        line, head = extend(line, dt, at_end=False)
    if ext[1]:
        line, tail = extend(line, dt, at_end=True)
    # Resampling keeps the ends exactly, and ghost runs are straight 1-unit steps.
    return resample(line, 1.0, closed=False), head, tail


def pen_clock(line: np.ndarray, head: int, tail: int):
    """Normalised 'effort time' u(s) along the stroke: slower where it curves.
    Ghost runs cost almost nothing, so the tip's corners ink at touchdown."""
    d = np.diff(line, axis=0)
    ang = ndimage.gaussian_filter1d(np.unwrap(np.arctan2(d[:, 1], d[:, 0])), 4)
    kappa = np.abs(np.gradient(ang))  # per unit length: samples are 1 unit apart
    slow = (1 + CURVE_R * kappa) ** (1 / 3)
    slow[:head] = 0.01
    if tail:
        slow[-tail:] = 0.01
    u = np.concatenate([[0], np.cumsum(slow)])
    return u / u[-1]


def wall_to_s(tau: np.ndarray, u_s: np.ndarray) -> np.ndarray:
    mj = 10 * tau**3 - 15 * tau**4 + 6 * tau**5
    u = ENDS_SOFT * mj + (1 - ENDS_SOFT) * tau
    return np.interp(u, u_s, np.arange(len(u_s), dtype=float))


def open_path(cubics: list[np.ndarray]) -> str:
    return to_path([cubics])[:-1]


def bez_len(cubics) -> float:
    t = np.linspace(0, 1, 65)
    return sum(np.hypot(*np.diff(_bez(c, t), axis=0).T).sum() for c in cubics)


def schedule(strokes: list[dict]) -> None:
    """Sets start/dur (ms) on each pen stroke."""
    for part, (t0, t1) in [('bars-in', BARS_IN), ('bars-out', BARS_OUT)]:
        group = [s for s in strokes if s['part'] == part]
        dur = (t1 - t0) - BAR_STAGGER * (len(group) - 1)
        for j, s in enumerate(group):
            s['start'], s['dur'] = t0 + j * BAR_STAGGER, dur
    word = [s for s in strokes if s['part'] == 'word']
    gaps = [0] + [{'join': 0, 'lift': GAP_LIFT, 'glyph': GAP_GLYPH}[s['after']] for s in word[1:]]
    budget = WORD[1] - WORD[0] - sum(gaps)
    lo, hi = 0.0, 100.0
    for _ in range(60):
        k = (lo + hi) / 2
        total = sum(max(MIN_DUR, k * s['ink'] ** DUR_EXP) for s in word)
        lo, hi = (k, hi) if total < budget else (lo, k)
    t = WORD[0]
    for s, gap in zip(word, gaps):
        t += gap
        s['start'], s['dur'] = t, max(MIN_DUR, k * s['ink'] ** DUR_EXP)
        t += s['dur']


def build_strokes(logo: np.ndarray) -> tuple[list[dict], list[dict], dict]:
    dt = ndimage.distance_transform_edt(logo) / GRID
    graph, nodes_xy, tree = skeleton_graph(logo)

    strokes = []
    for plan in PLAN:
        line, head, tail = centerline(plan, graph, nodes_xy, tree, dt)
        S = len(line) - 1
        strokes.append({**plan, 'line': line, 'S': S, 'ink': S - head - tail, 'real': (head, S - tail),
                        'u': pen_clock(line, head, tail)})
    schedule(strokes)

    # Segments: equal cuts of each pen stroke's inked spine.
    segs = []
    for si, s in enumerate(strokes):
        lo, hi = s['real']
        n = max(1, round((hi - lo) / SEG_LEN))
        cuts = np.round(np.linspace(lo, hi, n + 1)).astype(int)
        cuts[0], cuts[-1] = 0, s['S']  # ghost runs ride on the end segments
        segs += [dict(stroke=si, a=a, b=b) for a, b in zip(cuts, cuts[1:])]

    # Territories: geodesic split of the ink by nearest segment spine, so a
    # wide stroke can never reveal a neighbour (or its own other pass) early.
    seeds = Image.new('I', (logo.shape[1], logo.shape[0]), 0)
    draw = ImageDraw.Draw(seeds)
    for i, g in enumerate(segs):
        # Ghost runs don't seed: past a tip they can cross into other ink.
        lo, hi = strokes[g['stroke']]['real']
        spine = strokes[g['stroke']]['line'][max(g['a'], lo):min(g['b'], hi) + 1] * GRID
        if len(spine) > 1:
            draw.line([tuple(p) for p in spine], fill=i + 1, width=1)
    seeds = np.asarray(seeds).astype(np.int32)
    seeds[~logo] = 0
    labels = watershed(ndimage.distance_transform_edt(seeds == 0), markers=seeds, mask=logo)

    grow = disk(TERRITORY_GROW * GRID)
    m = TERRITORY_GROW * GRID + 2
    for i, g in enumerate(segs):
        line = strokes[g['stroke']]['line']
        ys, xs = np.nonzero(labels == i + 1)
        assert len(ys), f'segment {i} owns no ink'
        # Wide enough to reach the farthest pixel it owns (serif flanges, drops).
        far = cKDTree(line[g['a']:g['b'] + 1]).query(np.column_stack([xs, ys]) / GRID)[0].max()
        g['w'] = 2 * far + WIDTH_PAD
        # Each segment draws [a - e, b + e], so its flat (butt) front is already
        # past the territory border by the time it gets there.
        e = int(g['w'] / 2)
        g['r0'], g['r1'] = max(0, g['a'] - e), min(strokes[g['stroke']]['S'], g['b'] + e)

        y0, x0 = max(0, ys.min() - m), max(0, xs.min() - m)
        y1, x1 = min(logo.shape[0], ys.max() + m + 1), min(logo.shape[1], xs.max() + m + 1)
        own = ndimage.binary_fill_holes(ndimage.binary_dilation(labels[y0:y1, x0:x1] == i + 1, grow))
        g['box'], g['own'] = (y0, y1, x0, x1), own
        polys = []
        for c in find_contours(np.pad(own, 1).astype(float), 0.5):
            if len(c) < 8:
                continue
            c = approximate_polygon(c, CLIP_TOL * GRID)
            pts = [((x - 1 + x0) / GRID, (y - 1 + y0) / GRID) for y, x in c[:-1]]
            polys.append('M' + 'L'.join(f'{x:.0f} {y:.0f}' for x, y in pts) + 'Z')
        g['clip'] = ''.join(polys)

    # Geometry and timing per segment.
    for g in segs:
        s = strokes[g['stroke']]
        pts = s['line'][g['r0']:g['r1'] + 1][::2]
        if not np.allclose(pts[-1], s['line'][g['r1']]):
            pts = np.vstack([pts, s['line'][g['r1']]])
        k = min(3, len(pts) - 1)
        cubics = fit_cubics(pts, _unit(pts[k] - pts[0]), _unit(pts[-1 - k] - pts[-1]), 0.6)
        g['d'] = open_path(cubics)
        g['len'] = int(np.ceil(bez_len(cubics))) + 1

        tau = np.linspace(0, 1, 4001)
        pos = wall_to_s(tau, s['u'])
        t0 = np.interp(g['r0'], pos, tau)
        t1 = np.interp(g['r1'], pos, tau)
        lam = np.linspace(0, 1, EASE_POINTS)
        local = (wall_to_s(t0 + lam * (t1 - t0), s['u']) - g['r0']) / (g['r1'] - g['r0'])
        local = np.clip(local, 0, 1)
        local[0], local[-1] = 0, 1
        g['delay'] = int(round(s['start'] + t0 * s['dur']))
        g['dur'] = max(1, int(round((t1 - t0) * s['dur'])))
        g['ease'] = 'linear(' + ','.join(fmt3(v) for v in local) + ')'
        g['local'] = local

    write_end = max(g['delay'] + g['dur'] for g in segs)
    settle = BARS_OUT[1]
    exit_at = settle + SETTLE
    timeline = dict(
        WRITE_END=write_end,
        SETTLE_AT=settle,
        SETTLE_MS=SETTLE,
        EXIT_AT=exit_at,
        LIFT_MS=LIFT,
        CURTAIN_AT=exit_at + CURTAIN_LAG,
        CURTAIN_MS=CURTAIN,
        LAYER_STAGGER=LAYER_STAGGER,
        INTRO_TOTAL=exit_at + CURTAIN_LAG + CURTAIN + LAYER_STAGGER * (LAYERS - 1),
    )
    assert write_end <= settle + 5, f'writing ({write_end}ms) runs past the settle ({settle}ms)'
    return strokes, segs, timeline


def fmt3(v: float) -> str:
    s = f'{v:.3f}'.rstrip('0').rstrip('.')
    return s[1:] if s.startswith('0.') else s


def reveal(logo: np.ndarray, strokes, segs, t_ms: float) -> np.ndarray:
    """Raster stand-in for the browser: what the mask shows at time t. Exact
    butt-capped, round-joined strokes from a distance field, clipped like SVG."""
    out = np.zeros_like(logo)
    for g in segs:
        if t_ms <= g['delay']:
            continue
        lam = min(1.0, (t_ms - g['delay']) / g['dur'])
        p = np.interp(lam, np.linspace(0, 1, EASE_POINTS), g['local'])
        head = g['r0'] + p * (g['r1'] - g['r0'])
        line = strokes[g['stroke']]['line']
        n = int(np.floor(head))
        spine = line[g['r0']:n + 1]
        if head > n and n + 1 < len(line):
            spine = np.vstack([spine, line[n] + (head - n) * (line[n + 1] - line[n])])
        if len(spine) < 2:
            continue
        y0, y1, x0, x1 = g['box']
        px = spine * GRID - (x0, y0)
        im = Image.new('I', (x1 - x0, y1 - y0), 0)
        dr = ImageDraw.Draw(im)
        for j in range(len(px) - 1):
            dr.line([tuple(px[j]), tuple(px[j + 1])], fill=j + 1, width=1)
        lab = np.asarray(im)
        if not lab.any():
            continue
        dist, (iy, ix) = ndimage.distance_transform_edt(lab == 0, return_indices=True)
        near = lab[iy, ix]
        yy, xx = np.mgrid[0:lab.shape[0], 0:lab.shape[1]]
        cover = dist <= g['w'] * GRID / 2
        t_a = _unit(px[1] - px[0])
        t_b = _unit(px[-1] - px[-2])
        cover &= ~((near == 1) & ((xx - px[0][0]) * t_a[0] + (yy - px[0][1]) * t_a[1] < 0))
        cover &= ~((near == len(px) - 1) & ((xx - px[-1][0]) * t_b[0] + (yy - px[-1][1]) * t_b[1] > 0))
        out[y0:y1, x0:x1] |= cover & g['own']
    return out & logo


def debug_strokes(debug: Path, logo, strokes, segs, timeline, missed) -> None:
    rng = np.random.default_rng(3)
    labels_rgb = np.zeros(logo.shape + (3,), np.uint8)
    for g in segs:
        y0, y1, x0, x1 = g['box']
        col = rng.integers(60, 230, 3).astype(np.uint8)
        sub = labels_rgb[y0:y1, x0:x1]
        sub[g['own'] & logo[y0:y1, x0:x1]] = col
    labels_rgb[missed] = (255, 255, 255)
    im = Image.fromarray(labels_rgb)
    d = ImageDraw.Draw(im)
    for si, s in enumerate(strokes):
        pts = [tuple(p * GRID) for p in s['line']]
        d.line(pts, fill=(0, 0, 0), width=3)
        d.ellipse([pts[0][0] - 9, pts[0][1] - 9, pts[0][0] + 9, pts[0][1] + 9], fill=(0, 255, 0))
        d.ellipse([pts[-1][0] - 6, pts[-1][1] - 6, pts[-1][0] + 6, pts[-1][1] + 6], fill=(255, 0, 0))
        d.text((pts[0][0] + 12, pts[0][1] - 4), str(si), fill=(255, 255, 0))
        for p in s['pts']:
            q = (p[0] * GRID, p[1] * GRID)
            d.rectangle([q[0] - 4, q[1] - 4, q[0] + 4, q[1] + 4], outline=(0, 200, 255))
    im.resize((im.width // 2, im.height // 2), Image.LANCZOS).save(debug / 'strokes.png')

    times = [150, 400, 700, 1000, 1300, 1600, 1900, 2200, 2450, timeline['SETTLE_AT']]
    tiles = []
    for t in times:
        shown = reveal(logo, strokes, segs, t)
        rgb = np.full(logo.shape + (3,), 255, np.uint8)
        rgb[logo] = (245, 225, 222)
        rgb[shown] = (255, 33, 22)
        tile = Image.fromarray(rgb).resize((logo.shape[1] // 6, logo.shape[0] // 6), Image.LANCZOS)
        ImageDraw.Draw(tile).text((6, 4), f'{t}ms', fill=(0, 0, 0))
        tiles.append(tile)
    tw, th = tiles[0].size
    sheet = Image.new('RGB', (tw * 2 + 6, (th + 6) * 5), (60, 60, 60))
    for i, tile in enumerate(tiles):
        sheet.paste(tile, ((i % 2) * (tw + 6), (i // 2) * (th + 6)))
    sheet.save(debug / 'contact-sheet.png')


def write_strokes_ts(segs, timeline) -> None:
    rows = []
    for g in segs:
        rows.append(
            f'  {{ d: "{g["d"]}", w: {g["w"]:.0f}, len: {g["len"]}, delay: {g["delay"]}, '
            f'dur: {g["dur"]}, ease: "{g["ease"]}", clip: "{g["clip"]}" }},'
        )
    consts = '\n'.join(f'export const {k} = {v};' for k, v in timeline.items())
    STROKES_TS.write_text(
        '// Generated by scripts/make-intro.py — edit the PLAN there, not this file.\n'
        '//\n'
        '// Each pen stroke of the wordmark, in writing order, cut into segments. A\n'
        '// segment is a butt-capped mask stroke clipped to its own territory (the ink\n'
        '// nearest its spine), so its flat front only ever reveals its own letter part.\n'
        '// `ease` is that segment\'s slice of the whole pen stroke\'s velocity profile,\n'
        '// which keeps the pen speed continuous across segment joints.\n'
        '//\n'
        '// `len` is the measured length of the emitted bezier (+1); it seeds\n'
        '// stroke-dasharray/dashoffset, so no pathLength or getTotalLength() is needed.\n'
        'export type Segment = { d: string; w: number; len: number; delay: number; dur: number; ease: string; clip: string };\n'
        '\n'
        'export const SEGMENTS: Segment[] = [\n' + '\n'.join(rows) + '\n];\n',
        encoding='utf8',
    )
    TIMELINE_TS.write_text(
        '// Generated by scripts/make-intro.py with the strokes it has to follow.\n'
        '// Kept apart from strokes.ts so client code can import it without pulling\n'
        '// in the segment table.\n'
        '//\n'
        '// ms from first paint. IntroOverlay passes these to CSS, app/layout.tsx\n'
        '// tears down at INTRO_TOTAL, and components/motion/reveal.tsx releases\n'
        '// afterIntro content at CURTAIN_AT.\n' + consts + '\n',
        encoding='utf8',
    )


# ------------------------------------------------------------------ main ----

def write_outline(d: str) -> None:
    svg = SVG.read_text(encoding='utf8')
    SVG.write_text(re.sub(r' d="[^"]+"', lambda _: f' d="{d}"', svg, count=1), encoding='utf8')
    WORDMARK_TS.write_text(
        '// Generated by scripts/make-intro.py --outline: the potrace trace of the\n'
        '// original 386px PNG, smoothed (corner-preserving) and refit as cubics.\n'
        '// Same path as public/assets/utsah-wordmark.svg.\n'
        '// Server-only import — keep it out of client components or it ships in the JS bundle.\n'
        f'export const WORDMARK_D =\n  "{d}";\n',
        encoding='utf8',
    )


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    debug = Path(args[0]) if args else None
    if debug:
        debug.mkdir(parents=True, exist_ok=True)
    d = re.search(r' d="([^"]+)"', SVG.read_text(encoding='utf8')).group(1)

    if '--outline' in sys.argv:
        new_d = smooth_outline(d)
        a, b = rasterise(d, 1), rasterise(new_d, 1)
        drift = (a ^ b).sum() / a.sum()
        print(f'outline: {len(d)} -> {len(new_d)} chars, area drift {drift:.2%}')
        assert drift < MAX_AREA_DRIFT, 'smoothed outline drifted from the source'
        if debug:
            s = OUTLINE_SCALE
            hi_old, hi_new = rasterise(d, s), rasterise(new_d, s)
            for i, (x, y) in enumerate([(280, 40), (1500, 180), (1700, 440), (2110, 640), (560, 600)]):
                sl = np.s_[y * s:(y + 120) * s, x * s:(x + 200) * s]
                rgb = np.zeros(hi_old[sl].shape + (3,), np.uint8)
                rgb[hi_old[sl]] = (255, 80, 80)
                rgb[hi_new[sl]] = (255, 255, 255)
                rgb[hi_new[sl] & ~hi_old[sl]] = (80, 200, 255)
                Image.fromarray(rgb).save(debug / f'outline-crop{i}.png')
        write_outline(new_d)
        d = new_d

    logo = rasterise(d, GRID)
    strokes, segs, timeline = build_strokes(logo)
    assert not reveal(logo, strokes, segs, 0).any(), 'ink visible at t=0'
    done = reveal(logo, strokes, segs, timeline['WRITE_END'] + 1)
    uncovered = (logo & ~done).sum() / logo.sum()
    print(f'strokes: {len(strokes)} pen strokes, {len(segs)} segments, '
          f'{uncovered:.2%} ink never written, write ends {timeline["WRITE_END"]}ms')
    if debug:
        debug_strokes(debug, logo, strokes, segs, timeline, logo & ~done)
    assert uncovered < MAX_UNCOVERED, 'strokes leave ink unwritten'
    write_strokes_ts(segs, timeline)


if __name__ == '__main__':
    main()
