/**
 * The wedding motifs the gold thread becomes, built from exact curves (spirals,
 * a lemniscate, ellipses) in a 200-unit box, y down. They are centrelines only;
 * geometry.ts inks them with the broad-nib pen.
 *
 * `spine` is the stretch the thread itself travels: it arrives at the spine's
 * first point heading `entryDir` and leaves from its last heading `exitDir`, so
 * the line *becomes* the motif instead of stopping beside it. `ornaments`
 * branch off it (leaves, a rose, the second ring) and bloom as the pen passes
 * their root. A motif with no exitDir ends the thread.
 */

import { add, curve, deg, ellipse, len, mul, nearest, resample, rot, sub, unit, type Pt } from './geometry';

export type Ornament = {
  pts: Pt[];
  /** Taper both ends (leaves, sparkles) or only the free end (a branch off the spine). */
  taper: 'both' | 'end';
  /** Where on the spine (index into spine) it starts blooming; omitted = after the spine. */
  root?: number;
};

export type Motif = {
  spine: Pt[];
  entryDir: Pt;
  exitDir?: Pt;
  ornaments: Ornament[];
  /** Arc-length ranges (in units) where the spine lifts, for an over-under crossing. */
  spineGaps?: [number, number][];
};

/**
 * A leaf in one stroke: out to the tip along one edge, back along the other,
 * then up the midrib. The edges bow a little asymmetrically, and the blade
 * bends toward `curl` (a share of its length, + or -), like a real leaf.
 */
function leaf(base: Pt, tip: Pt, width: number, midrib = true, curl = 0.12): Pt[] {
  const axis = sub(tip, base);
  const l = len(axis);
  const n = rot(unit(axis), Math.PI / 2);
  const bend = (t: number) => mul(n, curl * l * Math.sin(Math.PI * t) * 0.5);
  const p = (t: number, side: number): Pt => {
    // Widest a third of the way up, then a long taper to the point.
    const shape = Math.sin(Math.PI * Math.pow(t, 0.8)) * (1 - 0.25 * t);
    return add(add(add(base, mul(axis, t)), bend(t)), mul(n, side * width * shape * (side > 0 ? 1 : 0.9)));
  };
  const out: Pt[] = [];
  for (let i = 0; i <= 48; i++) out.push(p(i / 48, 1));
  for (let i = 48; i >= 0; i--) out.push(p(i / 48, -1));
  if (midrib) for (let i = 1; i <= 30; i++) out.push(add(add(base, mul(axis, (i / 30) * 0.72)), bend((i / 30) * 0.72)));
  return out;
}

/**
 * A spiral winding inward: radius from r0 to r1 over `turns`, clockwise if
 * dir = 1. Oval, not round (`squash` on its minor axis, turned by `tilt`):
 * flourishes are built from ovals.
 */
function spiral(c: Pt, r0: number, r1: number, a0: number, turns: number, dir = 1, squash = 0.78, tilt = deg(-22), n = 300): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const r = r0 * Math.pow(r1 / r0, t);
    const a = a0 + dir * t * turns * 2 * Math.PI;
    out.push(add(c, rot([r * Math.cos(a), r * squash * Math.sin(a)], tilt)));
  }
  return out;
}

/** A four-point glint: two short strokes, tapered at both ends. */
function glint(c: Pt, size: number): Ornament[] {
  return [
    { pts: [add(c, [0, -size]), add(c, [0, size])], taper: 'both' },
    { pts: [add(c, [-size * 0.7, 0]), add(c, [size * 0.7, 0])], taper: 'both' },
  ];
}

const rootOn = (spine: Pt[], p: Pt) => nearest(spine, p);

/**
 * Rose: the thread comes down from the top right and becomes the stem, leaving
 * at the bottom left. Off it, a one-line rose — a spiral heart in a cup of
 * three oval petals — with leaves along the stem and a bud on a twig.
 */
function rose(): Motif {
  const spine = curve(
    [[178, 0], [150, 62], [118, 120], [70, 170], [0, 196]],
    [-0.35, 1],
    [-1, 0.25],
  );
  const on = (p: Pt) => rootOn(spine, p);
  const at = (p: Pt) => spine[on(p)];

  // The bloom, centred near (66, 60), drawn the way line-art roses are: a tight
  // spiral heart, two petals wrapping it from opposite sides, the back petal's
  // lip, and a cup that closes under it all, sitting on a calyx.
  const heart = spiral([68, 42], 10, 1.8, deg(200), 1.45, 1, 0.78, deg(-12));
  const stem = curve([at([126, 108]), [100, 108], [72, 98]], [-1, 0.05], [-1, -0.45]);
  const bloom = (pts: Pt[], a: Pt, b: Pt) => curve(pts, a, b);
  return {
    spine,
    entryDir: [-0.35, 1],
    exitDir: [-1, 0.25],
    ornaments: [
      { pts: stem, taper: 'end', root: on([126, 108]) },
      // Calyx: two little points where the stem meets the cup.
      { pts: leaf([70, 98], [52, 108], 4.5, false, 0.1), taper: 'both', root: on([124, 110]) },
      { pts: leaf([70, 98], [88, 110], 4.5, false, -0.1), taper: 'both', root: on([122, 113]) },
      // The cup: open at the top, its lips flaring out like a tulip's.
      { pts: bloom([[24, 30], [28, 64], [44, 88], [68, 97], [93, 87], [106, 62], [110, 28]], [0.12, 1], [0.2, -1]), taper: 'both', root: on([120, 116]) },
      // The back petal's edge: one rolling arch across the cup's mouth, higher at the left.
      { pts: bloom([[30, 34], [50, 20], [80, 22], [106, 34]], [0.75, -0.65], [0.85, 0.5]), taper: 'both', root: on([117, 121]) },
      // Petal edges sweeping in from each lip toward the heart, never meeting:
      // the asymmetry is what keeps it a flower and not a face.
      { pts: bloom([[26, 40], [36, 60], [58, 70]], [0.35, 1], [1, 0.15]), taper: 'both', root: on([114, 125]) },
      { pts: bloom([[109, 36], [100, 58], [80, 68]], [-0.3, 1], [-1, 0.3]), taper: 'both', root: on([112, 128]) },
      // An inner petal cradling the heart, open to the right.
      { pts: bloom([[58, 34], [51, 46], [60, 56], [78, 53]], [-0.55, 1], [1, -0.4]), taper: 'both', root: on([110, 131]) },
      { pts: heart, taper: 'both', root: on([108, 133]) },
      // Leaves down the stem, alternating.
      { pts: leaf(at([150, 62]), [194, 42], 15, true, 0.14), taper: 'both', root: on([150, 62]) },
      { pts: leaf(at([108, 132]), [146, 156], 14, true, -0.12), taper: 'both', root: on([108, 132]) },
      { pts: leaf(at([86, 158]), [46, 146], 13, true, 0.12), taper: 'both', root: on([86, 158]) },
      { pts: leaf(at([40, 186]), [20, 164], 8, false), taper: 'both', root: on([40, 186]) },
      // A bud on a twig near the top.
      { pts: curve([at([166, 30]), [180, 18], [186, 6]], [0.6, -1], [0.3, -1]), taper: 'end', root: on([166, 30]) },
      { pts: leaf([186, 8], [194, -16], 6, false, 0.05), taper: 'both', root: on([162, 40]) },
    ],
  };
}

/**
 * Laurel: the thread is the branch, a long C. Ribbed leaves in alternating
 * pairs point up it toward its tip, larger at the foot.
 */
function laurel(): Motif {
  const spine = curve(
    [[104, 0], [64, 64], [62, 132], [120, 198]],
    [-0.45, 1],
    [0.8, 0.6],
  );
  const ornaments: Ornament[] = [];
  const count = 9;
  for (let i = 0; i < count; i++) {
    // Foot to tip: big leaves low, small high.
    const at = Math.round((spine.length - 1) * (0.88 - i * 0.095));
    const p = spine[at];
    const back = unit(sub(spine[Math.max(0, at - 4)], spine[Math.min(spine.length - 1, at + 4)]));
    const size = 46 - i * 2.8;
    const side = i % 2 ? 1 : -1;
    const dir = rot(back, side * deg(40));
    ornaments.push({ pts: leaf(p, add(p, mul(dir, size)), size * 0.3, true, side * 0.1), taper: 'both', root: at });
  }
  // The pen comes down from the tip, so bloom in pen order.
  ornaments.sort((a, b) => (a.root ?? 0) - (b.root ?? 0));
  return { spine, entryDir: [-0.45, 1], exitDir: [0.8, 0.6], ornaments };
}

/** Infinity knot: the thread ties a lemniscate (forever) and carries on. */
function knot(): Motif {
  const a = 88;
  const c: Pt = [100, 100];
  const tilt = deg(-10);
  const pts: Pt[] = [];
  for (let i = 0; i <= 400; i++) {
    const t = Math.PI + (i / 400) * 2 * Math.PI;
    const d = 1 + Math.sin(t) ** 2;
    pts.push(add(c, rot([(a * Math.cos(t)) / d, (a * Math.sin(t) * Math.cos(t)) / d], tilt)));
  }
  // Leftmost point, travelling down: the thread arrives and leaves there.
  const dir = rot([0, 1], tilt);
  return { spine: pts, entryDir: dir, exitDir: dir, ornaments: [...glint([176, 50], 12), ...glint([192, 74], 6)] };
}

/** Heart: in from the left at the tip, round both lobes, out through the tip again. */
function heart(): Motif {
  const s = 4.9;
  const c: Pt = [100, 92];
  const at = (t: number): Pt => add(c, [
    s * 16 * Math.sin(t) ** 3,
    -s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)),
  ]);
  const pts: Pt[] = [];
  for (let i = 0; i <= 400; i++) pts.push(at(Math.PI - (i / 400) * 2 * Math.PI));
  return {
    spine: pts,
    entryDir: [1, -0.35],
    exitDir: [0.75, 0.66],
    ornaments: [...glint([176, 24], 12), ...glint([194, 52], 6)],
  };
}

/** Rings: the thread becomes the first; the second interlocks; a glint. The end. */
function rings(): Motif {
  const tilt = deg(-14);
  const r1c: Pt = [72, 114];
  const r2c: Pt = [128, 100];
  const ring = (c: Pt) => ellipse(c, 52, 42, tilt, -Math.PI / 2, 2 * Math.PI, 420);
  const one = ring(r1c);
  const two = ring(r2c);
  return {
    spine: one,
    entryDir: rot([1, 0], tilt),
    ornaments: [{ pts: two, taper: 'end' }, ...glint([168, 26], 14), ...glint([192, 54], 7)],
  };
}

export const MOTIFS = { rose, laurel, knot, heart, rings };
export type MotifName = keyof typeof MOTIFS;

/** Crossings of two closed loops, as indices into each (for over-under gaps). */
export function crossings(a: Pt[], b: Pt[], eps = 1.2): [number, number][] {
  const ra = resample(a, 1);
  const rb = resample(b, 1);
  const hits: [number, number][] = [];
  for (let i = 0; i < ra.length; i++) {
    for (let j = 0; j < rb.length; j++) {
      if (Math.abs(ra[i][0] - rb[j][0]) < eps && Math.abs(ra[i][1] - rb[j][1]) < eps) {
        if (!hits.some(([hi]) => Math.abs(hi - i) < 20)) hits.push([i, j]);
      }
    }
  }
  return hits;
}
