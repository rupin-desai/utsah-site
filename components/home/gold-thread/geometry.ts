/**
 * Pure geometry for the gold thread: smooth routes, arc-length sampling, and
 * calligraphic ink. No React, no DOM, so it runs anywhere (and the preview
 * script renders exactly what the page does).
 *
 * The ink model is a pointed pen, after copperplate: pressure — and so width —
 * comes only on downstrokes along the writing slant, while upstrokes and
 * crossing strokes stay hairlines. Curves therefore swell and thin on their own
 * the way a lettering artist's do, and two thick strokes rarely meet. Strokes
 * taper into their free ends, and can carry gaps (where one ring passes under
 * the other).
 */

export type Pt = [number, number];

export const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
export const len = (a: Pt) => Math.hypot(a[0], a[1]);
export const unit = (a: Pt): Pt => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l];
};
export const rot = (a: Pt, rad: number): Pt => [
  a[0] * Math.cos(rad) - a[1] * Math.sin(rad),
  a[0] * Math.sin(rad) + a[1] * Math.cos(rad),
];
export const deg = (d: number) => (d * Math.PI) / 180;

function cubicPts(p0: Pt, c1: Pt, c2: Pt, p1: Pt, step: number): Pt[] {
  const n = Math.max(2, Math.ceil((len(sub(c1, p0)) + len(sub(c2, c1)) + len(sub(p1, c2))) / step));
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push([
      u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0],
      u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1],
    ]);
  }
  return out;
}

/**
 * A smooth curve through `pts`. Tangents are Catmull-Rom directions, but each
 * span's handles are a third of that span's own chord, so it never overshoots
 * or loops however uneven the spacing. `startDir`/`endDir` pin the ends.
 */
export function curve(pts: Pt[], startDir?: Pt, endDir?: Pt, step = 1): Pt[] {
  const n = pts.length;
  if (n < 2) return pts.slice();
  const dirs = pts.map((p, i) => {
    if (i === 0) return unit(startDir ?? sub(pts[1], p));
    if (i === n - 1) return unit(endDir ?? sub(p, pts[n - 2]));
    return unit(sub(pts[i + 1], pts[i - 1]));
  });
  const out: Pt[] = [pts[0]];
  for (let i = 0; i < n - 1; i++) {
    const chord = len(sub(pts[i + 1], pts[i])) / 3;
    const seg = cubicPts(pts[i], add(pts[i], mul(dirs[i], chord)), sub(pts[i + 1], mul(dirs[i + 1], chord)), pts[i + 1], step);
    out.push(...seg.slice(1));
  }
  return out;
}

/**
 * One coordinate of a cubic spline through values `a` at parameters `t`:
 * the polynomial coefficients [a, b, c, d] of each span. Clamped to slope
 * `d0`/`dn` where given, natural (no bending) where not.
 */
function splineCoeffs(t: number[], a: number[], d0?: number, dn?: number) {
  const n = a.length - 1;
  const h = t.slice(0, n).map((ti, i) => t[i + 1] - ti);
  const alpha = new Array<number>(n + 1).fill(0);
  if (d0 !== undefined) alpha[0] = (3 * (a[1] - a[0])) / h[0] - 3 * d0;
  if (dn !== undefined) alpha[n] = 3 * dn - (3 * (a[n] - a[n - 1])) / h[n - 1];
  for (let i = 1; i < n; i++) alpha[i] = (3 / h[i]) * (a[i + 1] - a[i]) - (3 / h[i - 1]) * (a[i] - a[i - 1]);
  const l = new Array<number>(n + 1).fill(1);
  const mu = new Array<number>(n + 1).fill(0);
  const z = new Array<number>(n + 1).fill(0);
  if (d0 !== undefined) {
    l[0] = 2 * h[0];
    mu[0] = 0.5;
    z[0] = alpha[0] / l[0];
  }
  for (let i = 1; i < n; i++) {
    l[i] = 2 * (t[i + 1] - t[i - 1]) - h[i - 1] * mu[i - 1];
    mu[i] = h[i] / l[i];
    z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
  }
  const c = new Array<number>(n + 1).fill(0);
  if (dn !== undefined) {
    l[n] = h[n - 1] * (2 - mu[n - 1]);
    c[n] = (alpha[n] - h[n - 1] * z[n - 1]) / l[n];
  }
  const out: [number, number, number, number][] = [];
  for (let j = n - 1; j >= 0; j--) {
    c[j] = z[j] - mu[j] * c[j + 1];
    const b = (a[j + 1] - a[j]) / h[j] - (h[j] * (c[j + 1] + 2 * c[j])) / 3;
    out[j] = [a[j], b, c[j], (c[j + 1] - c[j]) / (3 * h[j])];
  }
  return out;
}

/**
 * A silk-smooth curve through `pts`: a cubic spline parameterised by chord
 * length, so curvature, not just direction, flows continuously through every
 * waypoint (C2). `curve` is C1: its direction is continuous but its bend can
 * jump where a short span meets a long one, which the eye reads as a lump on a
 * long sweep. The ends are clamped to `startDir`/`endDir`, so hand-offs and
 * motif joins stay exact.
 */
export function spline(pts: Pt[], startDir?: Pt, endDir?: Pt, step = 1): Pt[] {
  const n = pts.length;
  if (n < 3) return curve(pts, startDir, endDir, step);
  const t = [0];
  for (let i = 1; i < n; i++) t.push(t[i - 1] + Math.max(1e-6, len(sub(pts[i], pts[i - 1]))));
  // Chord-length parameter: unit-speed-ish, so a unit direction is the right slope.
  const s0 = startDir ? unit(startDir) : undefined;
  const s1 = endDir ? unit(endDir) : undefined;
  const cx = splineCoeffs(t, pts.map((p) => p[0]), s0?.[0], s1?.[0]);
  const cy = splineCoeffs(t, pts.map((p) => p[1]), s0?.[1], s1?.[1]);
  const out: Pt[] = [pts[0]];
  for (let j = 0; j < n - 1; j++) {
    const hj = t[j + 1] - t[j];
    const m = Math.max(1, Math.ceil(hj / step));
    for (let i = 1; i <= m; i++) {
      const x = (hj * i) / m;
      const [ax, bx, ccx, dx] = cx[j];
      const [ay, by, ccy, dy] = cy[j];
      out.push([ax + x * (bx + x * (ccx + x * dx)), ay + x * (by + x * (ccy + x * dy))]);
    }
  }
  return out;
}

/** Points along an ellipse, from `a0` sweeping `sweep` radians (positive = clockwise on screen). */
export function ellipse(c: Pt, rx: number, ry: number, tilt: number, a0: number, sweep: number, n = 240): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (sweep * i) / n;
    out.push(add(c, rot([rx * Math.cos(a), ry * Math.sin(a)], tilt)));
  }
  return out;
}

/** Re-spaces a polyline evenly along its length. */
export function resample(pts: Pt[], step: number): Pt[] {
  const out: Pt[] = [pts[0]];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const d = len(sub(b, a));
    let t = step - carry;
    while (t <= d) {
      out.push(add(a, mul(sub(b, a), t / d)));
      t += step;
    }
    carry = d - (t - step);
  }
  const last = pts[pts.length - 1];
  if (len(sub(last, out[out.length - 1])) > step * 0.25) out.push(last);
  return out;
}

export const arcLength = (pts: Pt[]) => pts.reduce((s, p, i) => (i ? s + len(sub(p, pts[i - 1])) : 0), 0);

/** Index of the sample nearest `p`. */
export function nearest(pts: Pt[], p: Pt): number {
  let best = 0;
  let bestD = Infinity;
  pts.forEach((q, i) => {
    const d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

export type Pen = {
  /** Hairline width, px. */
  min: number;
  /** Full-swell width, px: a downstroke straight along the slant. */
  max: number;
  /** Direction of a downstroke, radians (copperplate: 55° slant, so ~125°, down and left). */
  slant: number;
};

export type InkOptions = {
  /** Taper the first / last this many px down to a fine point. */
  taperStart?: number;
  taperEnd?: number;
  /** Arc-length ranges [from, to] in px where the ink lifts (an over-under crossing). */
  gaps?: [number, number][];
  /** Scales the swell (not the hairline) along the stroke, by arc length in px. */
  pressure?: (s: number) => number;
};

/** How much a stroke heading `angle` presses: only downstrokes do. */
const shade = (angle: number, slant: number) => {
  const along = Math.cos(angle - slant);
  return along > 0 ? along ** 1.6 : 0;
};

/**
 * A short run of a stroke. Ink is cut into chunks so that drawing it is cheap:
 * only the chunk under the pen needs a reveal mask, and a mask that small is
 * quick to re-render; every finished chunk is a plain fill.
 */
export type Chunk = {
  /** Filled outline of this run, as path data (nonzero). */
  outline: string;
  /** Its centreline, as path data: what the reveal mask strokes along. */
  center: string;
  /** Where the run starts and ends along the whole stroke, px. */
  s0: number;
  s1: number;
  /** Bounds [x, y, w, h], padded by the widest ink: the mask region. */
  box: [number, number, number, number];
};

export type Ink = {
  chunks: Chunk[];
  /** Centreline length, px. */
  length: number;
  /** Widest point, px: the reveal stroke must cover it. */
  maxWidth: number;
};

/** Ink is cut into runs about this long. */
const CHUNK = 240;
/** Neighbouring runs overlap by this many samples, so no hairline seam shows between fills. */
const SEAM = 2;

const smoothstep = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};
const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Turns a centreline (already in px) into calligraphic ink. 2px samples: at
 * these widths a finer step is invisible and only costs paint.
 */
export function ink(raw: Pt[], pen: Pen, opts: InkOptions = {}, step = 2): Ink {
  const pts = resample(raw, step);
  const n = pts.length;
  const s: number[] = [0];
  for (let i = 1; i < n; i++) s.push(s[i - 1] + len(sub(pts[i], pts[i - 1])));
  const total = s[n - 1] || 1;

  // Direction from a few samples either side: steadier than neighbours alone.
  const k = 3;
  const angle = pts.map((_, i) => {
    const d = sub(pts[Math.min(n - 1, i + k)], pts[Math.max(0, i - k)]);
    return Math.atan2(d[1], d[0]);
  });

  const widths = pts.map((_, i) => {
    let w = pen.min + (pen.max - pen.min) * shade(angle[i], pen.slant) * (opts.pressure?.(s[i]) ?? 1);
    if (opts.taperStart) w *= 0.08 + 0.92 * smoothstep(s[i] / opts.taperStart);
    if (opts.taperEnd) w *= 0.08 + 0.92 * smoothstep((total - s[i]) / opts.taperEnd);
    for (const [g0, g1] of opts.gaps ?? []) {
      const edge = Math.max(1.5, step);
      const inside = Math.min(smoothstep((s[i] - g0) / edge), smoothstep((g1 - s[i]) / edge));
      w *= 1 - inside;
    }
    return w;
  });
  // Light smoothing so the swell never steps.
  const ws = widths.map((_, i) => {
    let acc = 0;
    let cnt = 0;
    for (let j = Math.max(0, i - 2); j <= Math.min(n - 1, i + 2); j++) {
      acc += widths[j];
      cnt++;
    }
    return Math.min(widths[i] * 1.5, acc / cnt);
  });

  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const nx = -Math.sin(angle[i]);
    const ny = Math.cos(angle[i]);
    const h = ws[i] / 2;
    left.push([pts[i][0] + nx * h, pts[i][1] + ny * h]);
    right.push([pts[i][0] - nx * h, pts[i][1] - ny * h]);
  }
  const maxWidth = Math.max(...ws);
  const xy = (p: Pt) => `${r1(p[0])} ${r1(p[1])}`;

  // Equal runs of about CHUNK px; the last absorbs the remainder.
  const count = Math.max(1, Math.round(total / CHUNK));
  const chunks: Chunk[] = [];
  let i0 = 0;
  for (let c = 0; c < count; c++) {
    const target = (total * (c + 1)) / count;
    let i1 = c === count - 1 ? n - 1 : i0;
    while (i1 < n - 1 && s[i1] < target) i1++;
    // The fill overlaps its neighbours a little; the reveal does not.
    const a = Math.max(0, i0 - SEAM);
    const b = Math.min(n - 1, i1 + SEAM);
    const l = left.slice(a, b + 1);
    const r = right.slice(a, b + 1).reverse();
    const xs = [...l, ...r].map((p) => p[0]);
    const ys = [...l, ...r].map((p) => p[1]);
    const pad = maxWidth + 2;
    const run = resample(pts.slice(i0, i1 + 1), 3);
    chunks.push({
      outline: `M${l.map(xy).join('L')}L${r.map(xy).join('L')}Z`,
      center: `M${run.map(xy).join('L')}`,
      s0: s[i0],
      s1: s[i1],
      box: [
        Math.floor(Math.min(...xs) - pad),
        Math.floor(Math.min(...ys) - pad),
        Math.ceil(Math.max(...xs) - Math.min(...xs) + 2 * pad),
        Math.ceil(Math.max(...ys) - Math.min(...ys) + 2 * pad),
      ],
    });
    i0 = i1;
  }
  return { chunks, length: total, maxWidth };
}
