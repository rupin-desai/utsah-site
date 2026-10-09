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
  create: {
    desktop: {
      before: [[0.84, 0], [0.75, 0.09]],
      motif: { name: 'knot', at: [0.82, 0.18], size: 270 },
      after: [[0.66, 0.3], [0.4, 0.42], [0.2, 0.55]],
    },
    compact: {
      before: [[0.84, 0]],
      motif: { name: 'knot', at: [0.78, 0.04], size: 120 },
      after: [[0.5, 0.14], [0.3, 0.3]],
    },
  },

  /** 05: begins again above the heading, a loop, into a heart; down the margin and back across beneath the reviews. */
  reviews: {
    desktop: {
      begins: true,
      before: [[0.06, 0.05], [0.3, 0.085], { loop: [0.47, 0.08], r: 38, squash: 0.6, tilt: -16 }, [0.62, 0.17]],
      motif: { name: 'heart', at: [0.8, 0.22], size: 260 },
      after: [[0.94, 0.42], [0.965, 0.72], [0.66, 0.94], [0.32, 1]],
    },
    compact: {
      begins: true,
      before: [[0.08, 0.02], [0.45, 0.035]],
      motif: { name: 'heart', at: [0.8, 0.06], size: 120 },
      after: [[0.97, 0.2], [0.97, 0.88], [0.55, 0.97], [0.32, 1]],
    },
  },

  /** 06: the finale, through the top gradient into two rings, above the band. */
  close: {
    desktop: {
      before: [[0.32, 0], [0.5, 0.12]],
      motif: { name: 'rings', at: [0.8, 0.15], size: 330 },
      after: [],
    },
    compact: {
      before: [[0.32, 0], [0.5, 0.07]],
      motif: { name: 'rings', at: [0.78, 0.15], size: 150 },
      after: [],
    },
  },
} satisfies Record<string, Thread>;
