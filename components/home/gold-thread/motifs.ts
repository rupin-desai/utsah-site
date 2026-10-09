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

/**
 * A small line-art rose, for clusters on other motifs: spiral heart, inner
 * petal, a cup with flared lips and the back petal's arch. `s` scales the
 * 40-unit design; `root` is the spine index it blooms from.
 */
function miniRose(c: Pt, s: number, root: number): Ornament[] {
  const at = (x: number, y: number): Pt => add(c, [x * s, y * s]);
  const pts = (ps: [number, number][]) => ps.map(([x, y]) => at(x, y));
  return [
    { pts: curve(pts([[-17, -6], [-14, 8], [0, 15], [14, 8], [18, -7]]), [0.15, 1], [0.15, -1]), taper: 'both', root },
    { pts: curve(pts([[-14, -9], [-4, -16], [8, -15], [16, -9]]), [0.8, -0.6], [0.8, 0.6]), taper: 'both', root },
    { pts: curve(pts([[-8, -10], [-11, -1], [-3, 6], [8, 3]]), [-0.5, 1], [1, -0.3]), taper: 'both', root },
    { pts: spiral(at(1, -5), 6 * s, 1.2 * s, deg(200), 1.4, 1, 0.8, deg(-12)), taper: 'both', root },
  ];
}

/**
 * Wedding arch: the thread climbs the arch from its left foot, over the
 * crown, down to the right foot. An inner rail gives it depth; roses and
 * leaves climb it at the left shoulder and the right foot.
 */
function arch(): Motif {
  const spine = curve(
    [[40, 198], [38, 112], [54, 50], [100, 20], [146, 50], [162, 112], [160, 198]],
    [0, -1],
    [0, 1],
  );
  const on = (p: Pt) => rootOn(spine, p);
  const at = (p: Pt) => spine[on(p)];
  const rail = curve([[54, 198], [53, 114], [67, 60], [100, 38], [133, 60], [147, 114], [146, 198]], [0, -1], [0, 1]);
  return {
    spine,
    entryDir: [0, -1],
    exitDir: [0, 1],
    ornaments: [
      { pts: rail, taper: 'both', root: on([40, 150]) },
      // Left shoulder: a rose with leaves fanning off the arch.
      ...miniRose([48, 60], 1.05, on([44, 80])),
      { pts: leaf(at([40, 100]), [14, 84], 10, true, 0.12), taper: 'both', root: on([40, 100]) },
      { pts: leaf(at([62, 38]), [52, 14], 9, true, -0.12), taper: 'both', root: on([62, 38]) },
      { pts: leaf(at([40, 124]), [20, 136], 8, false, -0.1), taper: 'both', root: on([40, 124]) },
      // Leaves trailing over the crown.
      { pts: leaf(at([100, 20]), [120, 4], 7, false, 0.1), taper: 'both', root: on([100, 20]) },
      { pts: leaf(at([128, 32]), [150, 22], 7, false, -0.1), taper: 'both', root: on([128, 32]) },
      // Right foot: a second rose, leaves round it.
      ...miniRose([168, 166], 0.95, on([161, 150])),
      { pts: leaf(at([161, 140]), [186, 124], 9, true, -0.12), taper: 'both', root: on([161, 140]) },
      { pts: leaf(at([160, 186]), [186, 196], 8, true, 0.12), taper: 'both', root: on([160, 186]) },
      ...glint([182, 30], 10),
    ],
  };
}

/** One laurel branch along `arc`, leaves pointing back toward its start (the tip). */
function laurelLeaves(arc: Pt[], count: number, size0: number, fromF: number, toF: number): Ornament[] {
  const out: Ornament[] = [];
  for (let i = 0; i < count; i++) {
    const f = toF - (i * (toF - fromF)) / (count - 1);
    const at = Math.round((arc.length - 1) * f);
    const p = arc[at];
    const back = unit(sub(arc[Math.max(0, at - 4)], arc[Math.min(arc.length - 1, at + 4)]));
    const size = size0 - i * 2.4;
    const side = i % 2 ? 1 : -1;
    out.push({ pts: leaf(p, add(p, mul(rot(back, side * deg(42)), size)), size * 0.3, true, side * 0.1), taper: 'both', root: at });
  }
  return out;
}

/**
 * Laurel wreath: the thread is the left branch, from its tip at the top round
 * to the foot; the mirrored right branch blooms alongside; a small bow ties
 * them at the foot.
 */
function wreath(): Motif {
  const c: Pt = [100, 104];
  const r = 76;
  // Angles on screen (y down): each tip sits 30 deg off the top, and each
  // branch runs 146 deg round its side to just short of the foot (90 deg).
  const arcL: Pt[] = [];
  const arcR: Pt[] = [];
  for (let i = 0; i <= 220; i++) {
    const a = deg(240) - (i / 220) * deg(146);
    arcL.push(add(c, [r * Math.cos(a), r * 0.96 * Math.sin(a)]));
    const b = deg(300) + (i / 220) * deg(146);
    arcR.push(add(c, [r * Math.cos(b), r * 0.96 * Math.sin(b)]));
  }
  const spine = arcL;
  const foot: Pt = [c[0], c[1] + r * 0.96];
  // Both branches run tip to foot at the same pace, so a right leaf blooms with
  // its left twin: same index.
  const leavesL = laurelLeaves(spine, 8, 30, 0.08, 0.86);
  const leavesR = laurelLeaves(arcR, 8, 30, 0.08, 0.86);
  const bow: Ornament[] = [
    { pts: ellipse(add(foot, [-12, -1]), 12, 6, deg(-18), 0, 2 * Math.PI, 80), taper: 'end' },
    { pts: ellipse(add(foot, [12, -1]), 12, 6, deg(18), Math.PI, 2 * Math.PI, 80), taper: 'end' },
    { pts: curve([add(foot, [-2, 3]), add(foot, [-8, 14]), add(foot, [-14, 24])], [-0.3, 1], [-0.6, 0.8]), taper: 'both' },
    { pts: curve([add(foot, [2, 3]), add(foot, [8, 14]), add(foot, [14, 24])], [0.3, 1], [0.6, 0.8]), taper: 'both' },
  ];
  return {
    spine,
    entryDir: unit(sub(spine[1], spine[0])),
    // The left branch reaches the foot travelling right: carry on that way.
    exitDir: unit(sub(spine[spine.length - 1], spine[spine.length - 2])),
    ornaments: [
      { pts: arcR, taper: 'both', root: 0 },
      ...[...leavesL, ...leavesR].sort((a, b) => (a.root ?? 0) - (b.root ?? 0)),
      ...bow,
      ...glint([100, 10], 9),
    ],
  };
}

/**
 * Vintage microphone: the thread is the cord, arriving from the left, looping
 * once and meeting the stand's foot. Then the stand, the yoke, the capsule
 * with its grille, two music notes and a glint.
 */
function microphone(): Motif {
  const spine = curve(
    [[0, 176], [26, 184], [52, 172], [58, 150], [44, 140], [32, 152], [42, 172], [72, 186], [100, 186]],
    [1, 0.2],
    [1, 0],
  );
  const end = spine.length - 1;
  const cx = 104;
  const note = (x: number, y: number, s: number): Ornament[] => [
    { pts: ellipse([x, y], 5 * s, 3.4 * s, deg(-24), 0, 2 * Math.PI, 60), taper: 'end' },
    { pts: [[x + 4.6 * s, y - 1.5 * s], [x + 4.6 * s, y - 26 * s]], taper: 'end' },
    { pts: curve([[x + 4.6 * s, y - 26 * s], [x + 12 * s, y - 20 * s], [x + 13 * s, y - 11 * s]], [1, 0.4], [0, 1]), taper: 'end' },
  ];
  return {
    spine,
    entryDir: [1, 0.2],
    exitDir: [1, 0],
    ornaments: [
      // Foot, pole, and the yoke that cradles the capsule.
      { pts: ellipse([cx, 188], 26, 6, 0, Math.PI, 2 * Math.PI + Math.PI, 120), taper: 'end', root: end },
      { pts: [[cx, 186], [cx, 128]], taper: 'end', root: end },
      { pts: curve([[cx - 28, 92], [cx - 22, 120], [cx, 128], [cx + 22, 120], [cx + 28, 92]], [0.1, 1], [0.1, -1]), taper: 'both', root: end },
      // The capsule and its grille.
      { pts: ellipse([cx, 72], 21, 36, 0, -Math.PI / 2, 2 * Math.PI, 200), taper: 'end', root: end },
      ...[52, 64, 76, 88].map((y): Ornament => {
        const half = 21 * Math.sqrt(Math.max(0, 1 - ((y - 72) / 36) ** 2)) - 3;
        return { pts: curve([[cx - half, y], [cx, y + 2.5], [cx + half, y]], [1, 0.12], [1, -0.12]), taper: 'both', root: end };
      }),
      ...note(156, 70, 1),
      ...note(178, 44, 0.75),
      ...glint([150, 24], 10),
    ],
  };
}

/**
 * A horizontal flourish divider, wedding-invitation style ("—∞—"). The spine
 * is one stroke designed left to right (an entry loop, a wave through the
 * centre, a spiral at rest) and then mirrored, so the thread, arriving from the
 * top right, enters at the right-hand loop and comes to rest in the left-hand
 * spiral. An infinity knot is threaded on it at the centre, drawn as the pen
 * passes, the line running straight through its crossing. Wide and shallow:
 * it spans the 200-unit box, about 30 units tall.
 */
function divider(): Motif {
  const c: Pt = [100, 100];
  const a = 22;
  const knotPts: Pt[] = [];
  // Lemniscate from its crossing (t = pi/2) once round back to the crossing.
  for (let i = 0; i <= 320; i++) {
    const t = Math.PI / 2 + (i / 320) * 2 * Math.PI;
    const d = 1 + Math.sin(t) ** 2;
    knotPts.push(add(c, [(a * Math.cos(t)) / d, (a * Math.sin(t) * Math.cos(t)) / d]));
  }
  const tail = spiral([186, 98], 11, 1.6, deg(150), 1.6, 1, 0.82, deg(-8));
  const tailIn = unit(sub(tail[1], tail[0]));
  // Entry loop, a wave in, straight through the knot's crossing, a wave out.
  const arms = curve(
    [[6, 84], [7, 97], [15, 104], [22, 97], [16, 90], [11, 96], [19, 104], [32, 102], [52, 96], [76, 100], c, [124, 100], [146, 104], [166, 99], tail[0]],
    [0.05, 1],
    tailIn,
  );
  const ltr: Pt[] = [...arms, ...tail.slice(1)];

  const mirror = ([x, y]: Pt): Pt => [200 - x, y];
  const spine = ltr.map(mirror);
  const on = (p: Pt) => rootOn(spine, mirror(p));
  const at = (p: Pt) => spine[on(p)];
  const leafAt = (p: Pt, tip: Pt, w: number, curl: number): Ornament => ({
    pts: leaf(at(p), mirror(tip), w, false, curl),
    taper: 'both',
    root: on(p),
  });
  return {
    spine,
    entryDir: [-0.05, 1],
    ornaments: [
      // The knot, threaded on at the centre as the pen passes.
      { pts: knotPts.map(mirror), taper: 'both', root: on(c) },
      // Leaves sprouting off both arms, alternating up and down.
      leafAt([46, 97], [38, 85], 3.6, 0.15),
      leafAt([62, 101], [56, 112], 3.4, -0.15),
      leafAt([136, 98], [144, 86], 3.6, -0.15),
      leafAt([154, 102], [161, 113], 3.4, 0.15),
      // A glint over the knot.
      ...glint([100, 76], 6),
      ...glint([113, 83], 3),
    ],
  };
}

export const MOTIFS = { rose, laurel, knot, heart, rings, arch, wreath, microphone, divider };
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
