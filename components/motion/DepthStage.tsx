'use client';

/**
 * One scene, pulled apart into depth. A back plate, a cut-out subject in front
 * of it, and a type band between them — so the subject stands in front of the
 * words and the words in front of the room.
 *
 *   back plate  ->  middle (type band)  ->  subject  ->  scrim  ->  front (copy)
 *
 * Two modes, chosen by what the back plate holds:
 *
 *   parallax  The back plate is CLEAN — the subject is not in it (the hero's
 *             night-bg, generated as an empty venue). Layers slide past each
 *             other at their own speeds, nearest fastest: plate, band,
 *             subject, copy. Nothing has to register any more, so the subject
 *             is placed on her own: a trimmed cut-out, bottom-anchored, sized
 *             by height and centred on her body (see `subject`), independently
 *             of how the room is cropped. A vignette on the room keeps the eye
 *             on her.
 *
 *   grow      The back plate still CONTAINS the subject (a cut-out made from
 *             one photo by scripts/make-layers.py). Any slide would show a
 *             double, so the subject may only grow, from its bottom edge,
 *             starting at FG_REST so it always covers its copy underneath.
 *
 * In grow mode both plates share one box, one object-fit and one
 * object-position, which is what keeps them registered. Moving layers are `data-scrub`, so the static
 * fallbacks in globals.css flatten the stack to the plain scene; the dim
 * carries its own hook, since "at rest" means something else there.
 */

import Image from 'next/image';
import {
  m,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
  type Transition,
  type Variants,
} from 'motion/react';
import { useEffect, type ReactNode } from 'react';
import { EASE_OUT, EASE_OUT_SOFT } from '@/components/motion/reveal';
import { useScrub } from '@/components/motion/scroll';
import { cn } from '@/lib/utils';

export type DepthMode = 'parallax' | 'grow';

/**
 * Parallax travel in vh at intensity 1; positive rises on exit. Nearest layer
 * fastest, and the back plate runs the other way — counter-motion, so the
 * subject and the room separate by 20vh while no single layer moves more than
 * a third of the screen. The band sits between them in depth and in speed.
 */
const TRAVEL = { bg: -6, band: 8, fg: 14, copy: 30 } as const;
/** Pointer depth, px at the screen edge — same ordering, much smaller. */
const POINTER = { bg: 5, band: 12, fg: 20 } as const;

/**
 * The back plate's box in parallax mode: wider than the stage for the
 * pointer, and taller at both ends than |TRAVEL.bg| so its sink (or, settling,
 * its rise) never shows an edge. Grow mode never slides, so its plates fit.
 */
const PARALLAX_BOX = '-inset-x-[3%] -inset-y-[8%]';
/**
 * The subject's box hangs this far below the stage. Her photo ends mid-thigh,
 * so its bottom edge must stay off-screen through her whole climb: keep it
 * greater than TRAVEL.fg.
 */
const SUBJECT_DROP = '-bottom-[16%]';

/** grow: the cut-out's resting scale, just past 1 so it covers its double. */
const FG_REST = 1.03;

/**
 * Entrances, for a stage that opens the page under the intro curtain. Premium
 * "dramatic reveal": 1.2s on the house expo-out, subject one beat behind.
 */
const SETTLE = { duration: 1.2, ease: EASE_OUT } as const;

/** parallax: each plate rises into place from its own depth. */
const riseIn = (fromVh: number, fade: boolean, delay = 0, settle: Transition = SETTLE): Variants => ({
  hidden: { transform: `translate3d(0px, ${fromVh}vh, 0px)`, ...(fade ? { opacity: 0 } : {}) },
  shown: {
    transform: 'translate3d(0px, 0vh, 0px)',
    ...(fade ? { opacity: 1 } : {}),
    transition: { ...settle, delay },
  },
});
const BG_IN = riseIn(3, false);
// The subject's rise has to be SEEN: started with the curtain, expo-out spends
// itself while she is still covered. So it waits for the curtain to pass her,
// travels only a little, on a softer curve, and doesn't fade — she is there as
// the screen uncovers and just settles up into place.
const FG_IN = riseIn(6.5, false, 0.55, { duration: 1.8, ease: EASE_OUT_SOFT });

/** grow: the room settles, the subject steps forward — opacity only, no slide. */
const STAGE_IN: Variants = {
  hidden: { transform: 'scale(1.1)' },
  shown: { transform: 'scale(1)', transition: SETTLE },
};
const SUBJECT_IN: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: 0.8, ease: EASE_OUT, delay: 0.25 } },
};

export type DepthStageProps = {
  /** Back plate and cut-out — always the same pixel size. */
  bg: string;
  fg: string;
  alt: string;
  /** See the file header. Only use `parallax` with a clean back plate. */
  mode?: DepthMode;
  /** Shared by both plates. Aim it at the subject; portrait screens crop hard. */
  objectPosition?: string;
  /**
   * parallax only: how to place the cut-out, which must be trimmed to its
   * alpha bounds (no transparent margin). `width`/`height` are its pixel size;
   * `className` sets its on-screen height, e.g. `h-[80svh] sm:h-[88svh]`;
   * `centerX` is where her body's visual centre sits across the image (0..1),
   * so she — not her veil — lands on the stage's centre line. `raw` serves the
   * file exactly as supplied, skipping Next's re-encode (a hand-finished
   * cut-out whose edges must not be recompressed).
   */
  subject?: { width: number; height: number; className?: string; centerX?: number; raw?: boolean };
  priority?: boolean;
  /** 0..1 across however the caller wants the depth to play. */
  progress: MotionValue<number>;
  /** How far the layers separate. 1 for a full-screen opener. */
  intensity?: number;
  /**
   * Play the intro entrance once this turns true. Omit for a stage below the
   * fold, which simply sits at rest.
   */
  entranceReady?: boolean;
  /**
   * Opener choreography: layers travel away from rest and the band and copy
   * leave — the next section then slides up over the stage. Without it the
   * layers travel INTO rest instead, settling as the section arrives.
   */
  exit?: boolean;
  /** The type band. Positioned by `middleClassName` (e.g. `top-[38%]`). */
  middle?: ReactNode;
  middleClassName?: string;
  front?: ReactNode;
  className?: string;
};

export default function DepthStage({
  bg,
  fg,
  alt,
  mode = 'grow',
  objectPosition = '50% 50%',
  subject,
  priority = false,
  progress,
  intensity = 1,
  entranceReady,
  exit = false,
  middle,
  middleClassName,
  front,
  className,
}: DepthStageProps) {
  const reduce = useReducedMotion();
  const parallax = mode === 'parallax';
  const k = intensity;

  // An exit travels away from rest; a settle travels into it.
  const travel = (vh: number): [string, string] =>
    !parallax ? ['0vh', '0vh'] : exit ? ['0vh', `${-vh * k}vh`] : [`${vh * k}vh`, '0vh'];

  const bgY = useScrub(progress, [0, 1], travel(TRAVEL.bg));
  const fgY = useScrub(progress, [0, 1], travel(TRAVEL.fg));
  const midY = useScrub(progress, [0, 1], parallax ? travel(TRAVEL.band) : ['0vh', `${-12 * k}vh`]);
  const bgScale = useScrub(progress, [0, 1], parallax ? [1, 1] : [1, 1 + 0.1 * k]);
  const fgScale = useScrub(progress, [0, 1], parallax ? [1, 1] : [FG_REST, FG_REST + 0.19 * k]);
  const bgDim = useScrub(progress, [0, 1], [0.12, 0.12 + 0.4 * k]);
  const midOpacity = useScrub(progress, exit ? [0.55, 0.9] : [0, 1], exit ? [1, 0] : [1, 1]);
  const frontY = useScrub(
    progress,
    [0, 0.5],
    ['0vh', !exit ? '0vh' : parallax ? `${-TRAVEL.copy}vh` : '-6vh'],
  );
  const frontOpacity = useScrub(progress, [0.08, 0.45], [1, exit ? 0 : 1]);

  // Pointer depth, desktop only: every layer drifts against the cursor by its
  // own amount. Sprung, so a flick of the mouse reads as weight, not jitter.
  // In grow mode only the band may move — the subject must not slide.
  const pointer = useMotionValue(0);
  const sprung = useSpring(pointer, { stiffness: 60, damping: 20 });
  const bgX = useTransform(sprung, [-1, 1], parallax ? [POINTER.bg, -POINTER.bg] : [0, 0]);
  const bandX = useTransform(sprung, [-1, 1], [POINTER.band, -POINTER.band]);
  const fgX = useTransform(sprung, [-1, 1], parallax ? [POINTER.fg, -POINTER.fg] : [0, 0]);
  useEffect(() => {
    if (reduce || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const move = (e: PointerEvent) => pointer.set((e.clientX / window.innerWidth) * 2 - 1);
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [reduce, pointer]);

  // Entrance wiring for one wrapper. `data-reveal` lets globals.css force the
  // resting state if the bundle never runs.
  const entrance = entranceReady !== undefined;
  const enter = (variants: Variants | undefined) =>
    entrance && variants
      ? {
          'data-reveal': true,
          variants,
          initial: 'hidden' as const,
          animate: entranceReady ? 'shown' : 'hidden',
        }
      : {};
  const box = cn('absolute', parallax ? PARALLAX_BOX : 'inset-0');
  const plate = { objectPosition };

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      <m.div className="absolute inset-0" {...enter(parallax ? undefined : STAGE_IN)}>
        <m.div className="absolute inset-0" {...enter(parallax ? BG_IN : undefined)}>
          <m.div data-scrub className={box} style={{ y: bgY, x: bgX, scale: bgScale }}>
            <Image src={bg} alt={alt} fill priority={priority} sizes="110vw" className="object-cover" style={plate} />
          </m.div>
          {/* Not data-scrub: forced to opacity 1 at rest it would black the
              scene out. globals.css gives [data-dim] its own resting value. */}
          <m.div data-dim className="absolute inset-0 bg-ink" style={{ opacity: bgDim }} />
          {parallax ? (
            // Focus: the room falls away toward the edges, so the eye settles
            // on the subject at the centre line. Static — it never repaints.
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_75%_at_50%_58%,transparent_35%,rgba(11,11,11,.6)_100%)]" />
          ) : null}
        </m.div>

        {middle ? (
          <m.div
            data-scrub
            className={cn('absolute inset-x-0', middleClassName)}
            style={{ y: midY, x: bandX, opacity: midOpacity }}
          >
            {middle}
          </m.div>
        ) : null}

        <m.div className="absolute inset-0" {...enter(parallax ? FG_IN : SUBJECT_IN)}>
          {parallax ? (
            // Her own box: bottom-anchored, centred, overflowing the stage's
            // sides freely (the stage clips), so her size is set by height alone.
            <m.div
              data-scrub
              className={cn('absolute -inset-x-1/2 flex items-end justify-center', SUBJECT_DROP)}
              style={{ y: fgY, x: fgX }}
            >
              <Image
                src={fg}
                alt=""
                width={subject?.width ?? 1}
                height={subject?.height ?? 1}
                priority={priority}
                unoptimized={subject?.raw}
                sizes="(max-width: 640px) 120vw, 60vw"
                className={cn('h-[88svh] w-auto max-w-none shrink-0', subject?.className)}
                // Shift by her own off-centre amount, in her own width.
                style={{ transform: `translateX(${(0.5 - (subject?.centerX ?? 0.5)) * 100}%)` }}
              />
            </m.div>
          ) : (
            <m.div data-scrub className="absolute inset-0 origin-bottom" style={{ scale: fgScale }}>
              <Image src={fg} alt="" fill priority={priority} sizes="100vw" className="object-cover" style={plate} />
            </m.div>
          )}
        </m.div>
      </m.div>

      {/* Bottom-up scrim for the copy; the subject's face and the band stay clear. */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(11,11,11,.6),transparent_55%)]" />

      {front ? (
        <m.div data-scrub className="absolute inset-0" style={{ y: frontY, opacity: frontOpacity }}>
          {front}
        </m.div>
      ) : null}

    </div>
  );
}
