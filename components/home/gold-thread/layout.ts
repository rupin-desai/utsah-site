/**
 * Lays one section's stretch of the thread out in px and schedules it. Pure,
 * so the preview script renders exactly what the page does.
 *
 * The thread in, the motif's spine and the thread out are ONE centreline, inked
 * as one stroke: no seam where the line becomes the motif. The connecting runs
 * are written lightly and the pressure builds into the motif, as a lettering
 * artist saves the shading for the flourish. Ornaments are inked separately and
 * bloom as the pen passes their root.
 *
 * Timing is in "pen time": an even pace, a little slower through the motif so
 * it can be read. Each part gets keyframes mapping the section's 0..1 progress
 * to how much of it is drawn.
 */

import { add, arcLength, curve, deg, ellipse, ink, mul, resample, rot, sub, unit, type Ink, type Pen, type Pt } from './geometry';
import { MOTIFS, crossings, type Motif, type MotifName } from './motifs';

/** Motifs are fixed drawings: build each once, not on every resize. */
const built = new Map<MotifName, Motif>();
const motifOf = (name: MotifName) => {
  let m = built.get(name);
  if (!m) built.set(name, (m = MOTIFS[name]()));
  return m;
};

/**
 * A cursive loop written into the run: an oval the line goes once round and
 * carries on from, entered where the oval's tangent matches the direction of
 * travel, so it joins without a kink.
 */
export type Loop = {
  /** Centre, as fractions of the box. */
  loop: Pt;
  /** Radius along the oval's long axis, px. */
  r: number;
  /** Short axis as a share of the long one. */
  squash?: number;
  /** Turn of the long axis, degrees. */
  tilt?: number;
  /** Clockwise on screen; counter-clockwise by default. */
  cw?: boolean;
};

export type RoutePoint = Pt | Loop;

export type ThreadRoute = {
  /** From the section's top edge ([x, 0]) toward the motif, as fractions of the box. */
  before: RoutePoint[];
  motif?: {
    name: MotifName;
    /** Centre, as fractions of the box. */
    at: Pt;
    /** Rendered size of the motif's 200-unit box, px. */
    size: number;
  };
  /**
   * From the motif to the bottom edge ([x, 1]). Ending above the bottom ends
   * the thread there (behind the cards); empty ends it at the motif.
   */
  after: RoutePoint[];
  /** The thread starts here: a free, tapered end instead of a hand-off. */
  begins?: boolean;
};

const isLoop = (p: RoutePoint): p is Loop => !Array.isArray(p);

/** How far a loop's pen drifts forward over one turn, in radii. */
const LOOP_DRIFT = 1.5;

/**
 * Route points to px, with each loop expanded into its oval. A loop needs the
 * direction of travel through it, taken from its neighbours (or `prev`/`next`
 * when it sits at either end).
 */
function expand(items: RoutePoint[], px: (p: Pt) => Pt, prev?: Pt, next?: Pt): Pt[] {
  const anchors = items.map((it) => px(isLoop(it) ? it.loop : it));
  const out: Pt[] = [];
  items.forEach((it, i) => {
    if (!isLoop(it)) {
      out.push(anchors[i]);
      return;
    }
    const before = i > 0 ? anchors[i - 1] : (prev ?? anchors[i]);
    const after = i < items.length - 1 ? anchors[i + 1] : (next ?? anchors[i]);
    const tilt = deg(it.tilt ?? 0);
    const rx = it.r;
    const ry = it.r * (it.squash ?? 0.62);
    const travel = unit(sub(after, before));
    const d = rot(travel, -tilt);
    // Parameter where the oval's tangent runs along d (sign picks the turning direction).
    const a0 = it.cw ? Math.atan2(-d[0] / rx, d[1] / ry) : Math.atan2(d[0] / rx, -d[1] / ry);
    // The pen drifts forward as it turns (a trochoid), so the loop crosses
    // itself like a cursive l instead of sitting on the line like a bubble.
    const oval = ellipse(anchors[i], rx, ry, tilt, a0, it.cw ? 2 * Math.PI : -2 * Math.PI, 140);
    out.push(...oval.map((p, j) => add(p, mul(travel, LOOP_DRIFT * rx * (j / (oval.length - 1) - 0.5)))));
  });
  return out;
}

const firstY = (items: RoutePoint[]) => {
  const p = items[0];
  return p === undefined ? undefined : isLoop(p) ? p.loop[1] : p[1];
};
const lastY = (items: RoutePoint[]) => {
  const p = items[items.length - 1];
  return p === undefined ? undefined : isLoop(p) ? p.loop[1] : p[1];
};

export type Part = Ink & {
  /** Progress keyframes, strictly rising, and how much of the part is drawn at each. */
  times: number[];
  values: number[];
};

const VIEW = 200;
/** The pen takes this much longer per px inside a motif. */
const MOTIF_SLOW = 1.8;
/** Ornaments draw a little quicker than the line they hang off. */
const ORNAMENT_PACE = 0.8;
/** Pressure on the connecting runs, as a share of the motif's. */
const RUN_PRESSURE = 0.5;
/** Pressure builds and fades over this many px either side of the motif. */
const PRESSURE_RAMP = 70;
const DOWN: Pt = [0, 1];

/** Copperplate's 55° slant: a downstroke heads down and a little left. */
export function penFor(compact: boolean): Pen {
  return compact ? { min: 0.7, max: 3.2, slant: deg(118) } : { min: 0.9, max: 5, slant: deg(118) };
}

const ramp = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

export function buildSegment(route: ThreadRoute, w: number, h: number, compact: boolean): Part[] {
  const px = ([x, y]: Pt): Pt => [x * w, y * h];
  const pen = penFor(compact);
  const leafPen: Pen = { ...pen, max: pen.max * 0.8 };
  const motif = route.motif ? motifOf(route.motif.name) : null;

  const handOffStart = !route.begins && firstY(route.before) === 0;
  const handOffEnd = route.after.length > 0 && lastY(route.after) === 1;
  // Where the motif's spine starts and ends, for loops next to it.
  const motifPx = (p: Pt) => {
    if (!route.motif) return undefined;
    const k0 = route.motif.size / VIEW;
    return add(px(route.motif.at), mul(sub(p, [VIEW / 2, VIEW / 2]), k0));
  };
  const before = expand(route.before, px, undefined, motif ? motifPx(motif.spine[0]) : undefined);
  const after = expand(route.after, px, motif ? motifPx(motif.spine[motif.spine.length - 1]) : undefined);

  let main: Pt[];
  let sA = 0;
  let sB = 0;
  let k = 1;
  let toPx = (p: Pt) => p;
  if (motif && route.motif) {
    k = route.motif.size / VIEW;
    const c = px(route.motif.at);
    toPx = (p: Pt) => add(c, mul(sub(p, [VIEW / 2, VIEW / 2]), k));
    const spine = motif.spine.map(toPx);
    const into = curve([...before, spine[0]], handOffStart ? DOWN : undefined, motif.entryDir);
    sA = arcLength(into);
    main = [...into, ...spine.slice(1)];
    sB = arcLength(main);
    if (after.length && motif.exitDir) {
      const out = curve([spine[spine.length - 1], ...after], motif.exitDir, handOffEnd ? DOWN : undefined);
      main = [...main, ...out.slice(1)];
    }
  } else {
    main = curve([...before, ...after], handOffStart ? DOWN : undefined, handOffEnd ? DOWN : undefined);
  }
  const L = arcLength(main);

  const ornaments = (motif?.ornaments ?? []).map((o) => ({ ...o, pts: o.pts.map(toPx) }));

  // Rings: each lifts where it passes under the other, so they interlock.
  let mainGaps: [number, number][] = [];
  const ornamentGaps: [number, number][][] = [];
  if (route.motif?.name === 'rings' && ornaments[0]) {
    const one = resample(main, 1);
    const hits = crossings(one, ornaments[0].pts).filter(([i]) => i >= sA - 2);
    const half = pen.max * 1.5 + 2.5;
    if (hits.length >= 2) {
      mainGaps = [[hits[1][0] - half, hits[1][0] + half]];
      ornamentGaps[0] = [[hits[0][1] - half, hits[0][1] + half]];
    }
  }

  // Light on the runs, full pressure through the motif.
  const pressure = (s: number) => {
    if (!motif) return RUN_PRESSURE;
    const inMotif = Math.min(ramp((s - sA + PRESSURE_RAMP) / PRESSURE_RAMP), ramp((sB + PRESSURE_RAMP - s) / PRESSURE_RAMP));
    return RUN_PRESSURE + (1 - RUN_PRESSURE) * inMotif;
  };
  const mainInk = ink(main, pen, {
    taperStart: handOffStart ? 0 : 70,
    taperEnd: handOffEnd ? 0 : 60,
    gaps: mainGaps,
    pressure,
  });

  // Pen time along the main line.
  const T = (s: number) => {
    if (!motif || s <= sA) return s;
    if (s <= sB) return sA + (s - sA) * MOTIF_SLOW;
    return sA + (sB - sA) * MOTIF_SLOW + (s - sB);
  };

  const ornamentInks = ornaments.map((o, i) => {
    const l = arcLength(o.pts);
    return ink(o.pts, leafPen, {
      taperStart: o.taper === 'both' ? Math.min(16, l / 3) : 0,
      taperEnd: Math.min(28, l / 3),
      gaps: ornamentGaps[i],
    });
  });

  // Rooted ornaments bloom as the pen passes their root; the rest follow the
  // spine one after another, overlapping a little.
  let queue = T(sB);
  const ornamentTimes = ornaments.map((o, i): [number, number] => {
    const d = ornamentInks[i].length * ORNAMENT_PACE;
    if (o.root !== undefined && motif) {
      const start = T(sA + arcLength(motif.spine.slice(0, o.root + 1)) * k);
      return [start, start + d];
    }
    const start = queue;
    queue += d * 0.6;
    return [start, start + d];
  });

  const end = Math.max(T(L), ...ornamentTimes.map(([, b]) => b));
  const keys = (pairs: [number, number][]) => {
    // Strictly rising times inside [0, 1], as scroll-linked scrubbing requires.
    const out: [number, number][] = [];
    for (const [t, v] of pairs) {
      const tt = Math.min(1, Math.max(0, t / end));
      if (!out.length || tt > out[out.length - 1][0] + 1e-4) out.push([tt, v]);
    }
    return { times: out.map((p) => p[0]), values: out.map((p) => p[1]) };
  };

  return [
    {
      ...mainInk,
      ...keys(motif ? [[0, 0], [T(sA), sA / L], [T(sB), sB / L], [T(L), 1]] : [[0, 0], [L, 1]]),
    },
    ...ornamentInks.map((o, i) => ({ ...o, ...keys([[ornamentTimes[i][0], 0], [ornamentTimes[i][1], 1]]) })),
  ];
}
