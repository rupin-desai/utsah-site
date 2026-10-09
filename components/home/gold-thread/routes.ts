import type { ThreadRoute } from './layout';

/**
 * The gold thread's route down the home page, one entry per section, in order.
 * Points are fractions of each section's box; loops are cursive ovals written
 * into the run (layout.ts). It travels the full width in long oval sweeps,
 * passing behind the copy (copy always paints above it), with each motif set
 * in its section's open space.
 *
 * Hand-off rule: a segment's last x is the next segment's first x, and every
 * boundary is crossed heading straight down, so the line meets itself without
 * a kink. Across the collage and gallery it breaks: it ends behind the "What we
 * create" cards and begins again, tapered, at the top of Reviews.
 *
 * Compact routes (under 1200px) keep the motifs smaller and in corners.
 */

export type Thread = { desktop: ThreadRoute; compact: ThreadRoute };

export const THREAD = {
  /** 01, pinned: begins top left, a loop across the top, down the right into a rose below the copy's short last line. */
  manifesto: {
    desktop: {
      begins: true,
      silk: true,
      before: [[0.06, 0.09], [0.22, 0.145], [0.38, 0.115], { loop: [0.55, 0.1], r: 44, squash: 0.6, tilt: -20 }, [0.74, 0.16], [0.94, 0.38]],
      motif: { name: 'rose', at: [0.85, 0.77], size: 350 },
      after: [[0.42, 0.95], [0.2, 1]],
    },
    compact: {
      begins: true,
      silk: true,
      before: [[0.08, 0.05], [0.5, 0.075]],
      motif: { name: 'rose', at: [0.78, 0.2], size: 150 },
      after: [[0.9, 0.5], [0.86, 0.84], [0.42, 0.93], [0.22, 1]],
    },
  },

  /** 02, pinned: a laurel at the left of the figure, then across beneath it with a loop. */
  stats: {
    desktop: {
      silk: true,
      before: [[0.2, 0]],
      motif: { name: 'laurel', at: [0.17, 0.5], size: 330 },
      after: [[0.4, 0.83], { loop: [0.6, 0.85], r: 38, squash: 0.6, tilt: -14 }, [0.8, 0.9], [0.84, 1]],
    },
    compact: {
      silk: true,
      before: [[0.22, 0], [0.1, 0.4]],
      motif: { name: 'laurel', at: [0.16, 0.78], size: 150 },
      after: [[0.6, 0.95], [0.84, 1]],
    },
  },

  /** 03: an infinity knot beside the heading, then a long sweep left behind the cards, where it ends. */
  /**
   * 03, the heading: the line arrives from the stats, passes the heading and
   * hands on to the first chapter. The chapters' own segments are below
   * (CHAPTER_THREAD).
   */
  create: {
    // Straight down: the box is short, so any waypoint here becomes a wiggle.
    // The stats line turns into it and the first chapter's curves out of it.
    desktop: { before: [[0.84, 0]], after: [[0.84, 1]] },
    compact: { before: [[0.84, 0]], after: [[0.84, 1]] },
  },

  /**
   * Between the chapters and the collage grid: a short 46svh interlude. The
   * thread drops in from the Live chapter and draws a horizontal divider
   * ("—∞—", motifs.ts) right to left, centred in the box, coming to rest in
   * its spiral.
   */
  interlude: {
    desktop: {
      silk: true,
      // One fall from the hand-off into the divider's entry loop: no waypoint to wobble on.
      before: [[0.9, 0]],
      motif: { name: 'divider', at: [0.5, 0.48], size: 1100 },
      after: [],
    },
    compact: {
      silk: true,
      before: [[0.9, 0]],
      motif: { name: 'divider', at: [0.5, 0.48], size: 340 },
      after: [],
    },
  },
} satisfies Record<string, Thread>;

/**
 * "What we create" chapters (components/home/Chapters.tsx), keyed by the event
 * type's href. Each chapter is a pinned, full-screen stage, and its segment
 * lives in it: it enters at the top where the one before left off, draws its
 * motif in place over the upper story column while the chapter holds the
 * screen, and leaves at the bottom where the next picks up. The last one
 * tapers away before the collage.
 *
 * Desktop stage at 1440x900: the story column spans x 0.59-0.91, its copy
 * stacked up from the foot to about y 0.45, so each motif sits above it at
 * about (0.76, 0.28). Compact (under 1200, phones included) keeps the motif
 * small in the top-right corner.
 */
/**
 * Chapters pin once their stage's top reaches the top of the screen: 65svh
 * into a progress that runs 65 + DWELL (170) svh (Chapters.tsx), so at 0.28.
 * Each motif starts just after, and draws while its chapter holds still.
 */
const MOTIF_AT = 0.32;

export const CHAPTER_THREAD: Record<string, Thread> = {
  /** Weddings: down the left of the arch and a J-hook up into its left foot; out of the right foot, a loop, on down. */
  '/wedding': {
    desktop: {
      silk: true,
      motifAt: MOTIF_AT,
      before: [[0.84, 0], [0.8, 0.06], [0.69, 0.14], [0.655, 0.33], [0.675, 0.445]],
      motif: { name: 'arch', at: [0.76, 0.28], size: 250 },
      after: [[0.83, 0.52], { loop: [0.86, 0.62], r: 34, squash: 0.6, tilt: -16 }, [0.9, 0.8], [0.88, 1]],
    },
    compact: {
      silk: true,
      motifAt: MOTIF_AT,
      before: [[0.84, 0], [0.76, 0.08], [0.7, 0.2], [0.72, 0.285]],
      motif: { name: 'arch', at: [0.82, 0.2], size: 110 },
      after: [[0.9, 0.34], [0.95, 0.7], [0.88, 1]],
    },
  },
  /** Corporate: a loop, onto the wreath's left tip; from its foot, out and on down. */
  '/corporate': {
    desktop: {
      silk: true,
      motifAt: MOTIF_AT,
      before: [[0.88, 0], [0.89, 0.06], { loop: [0.86, 0.11], r: 30, squash: 0.6, tilt: -16 }, [0.8, 0.15]],
      motif: { name: 'wreath', at: [0.76, 0.29], size: 260 },
      after: [[0.88, 0.45], [0.92, 0.7], [0.86, 1]],
    },
    compact: {
      silk: true,
      motifAt: MOTIF_AT,
      before: [[0.88, 0], [0.9, 0.07], [0.86, 0.12]],
      motif: { name: 'wreath', at: [0.82, 0.2], size: 110 },
      after: [[0.94, 0.32], [0.96, 0.7], [0.86, 1]],
    },
  },
  /** Live: swings across and comes in from the left as the microphone's cord; then on down to the interlude's divider. */
  '/live': {
    desktop: {
      silk: true,
      motifAt: MOTIF_AT,
      before: [[0.86, 0], [0.9, 0.1], [0.84, 0.2], [0.68, 0.28], [0.62, 0.36]],
      motif: { name: 'microphone', at: [0.76, 0.28], size: 260 },
      after: [[0.9, 0.44], [0.95, 0.75], [0.9, 1]],
    },
    compact: {
      silk: true,
      motifAt: MOTIF_AT,
      before: [[0.86, 0], [0.92, 0.08], [0.8, 0.15], [0.66, 0.2]],
      motif: { name: 'microphone', at: [0.82, 0.2], size: 110 },
      after: [[0.93, 0.3], [0.95, 0.7], [0.9, 1]],
    },
  },
};
