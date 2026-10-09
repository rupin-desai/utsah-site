'use client';

/**
 * Pinned stats. One number owns the screen at a time; scroll counts it up,
 * holds it, then hands over to the next. No backdrop of its own: it sits on
 * the page's one black ground.
 *
 * Every stat lives in the same grid cell, so the stage is always exactly one
 * stat tall. Hand-overs are sequential, never a crossfade — two numerals this
 * size overlapping read as a smudge — so each stat leaves the stage a few
 * percent before the next one arrives.
 */

import { cubicBezier, m, useMotionValueEvent, useScroll, type MotionValue } from 'motion/react';
import { useEffect, useRef } from 'react';
import { PinTrack, useScrub, useStaticMotion } from '@/components/motion/scroll';
import { EYEBROW, EyebrowLabel } from '@/components/Eyebrow';
import ThreadSegment, { type ThreadSegmentProps } from '@/components/home/gold-thread/ThreadSegment';

/** The house expo-out, as an easing function for the count. */
const expoOut = cubicBezier(0.16, 1, 0.3, 1);

/** Fractions of one stat's slot. */
const ENTER = [0.04, 0.24] as const;
const EXIT = [0.78, 0.96] as const;
/** Where in its slot the count finishes. */
const COUNT_END = 0.55;
/** svh of scroll each stat owns: long enough to count up, then sit and be read. */
const SCROLL_PER_STAT = 140;

export type StatsSequenceProps = {
  index?: string;
  /** Chapter mark, top left; optional (the home page runs without). */
  eyebrow?: string;
  /** The section's accessible name; defaults to the eyebrow. */
  label?: string;
  /** `["50k+", "Happy guests"]` — digits count, the rest is a static suffix. */
  stats: string[][];
  /** This section's stretch of the gold thread (components/home/gold-thread). */
  thread?: Omit<ThreadSegmentProps, 'progress'>;
};

export default function StatsSequence({ index, eyebrow, label = eyebrow, stats, thread }: StatsSequenceProps) {
  const track = useRef<HTMLElement>(null);
  const isStatic = useStaticMotion();
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] });
  // Same pen line as every other segment: draws from the moment the stage's top
  // edge crosses 65% down the screen until the pin lets go.
  const { scrollYProgress: threadProgress } = useScroll({ target: track, offset: ['start 65%', 'end end'] });

  return (
    <PinTrack
      trackRef={track}
      isStatic={isStatic}
      label={label}
      tone="ink"
      // SCROLL_PER_STAT of scroll per stat on top of the one-screen stage.
      className="relative"
      style={{ height: `${100 + stats.length * SCROLL_PER_STAT}svh` }}
    >
      <div className="sticky top-0 isolate flex h-svh items-center overflow-hidden">
        {/* The chapter mark sits where every other section's does: top left
            of the shell, not centred over the figure. */}
        {eyebrow ? (
          <div className="page-shell absolute inset-x-0 top-28 sm:top-32">
            <p className={EYEBROW}>
              <EyebrowLabel index={index}>{eyebrow}</EyebrowLabel>
            </p>
          </div>
        ) : null}

        {thread ? <ThreadSegment {...thread} progress={threadProgress} /> : null}

        {/* relative: keeps the figures painting above the thread. */}
        <div data-stack className="page-shell relative grid">
          {stats.map(([value, label], i) => (
            <Stat
              key={label}
              value={value}
              label={label}
              index={i}
              count={stats.length}
              progress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </PinTrack>
  );
}

type StatProps = {
  value: string;
  label: string;
  index: number;
  count: number;
  progress: MotionValue<number>;
};

function Stat({ value, label, index, count, progress }: StatProps) {
  const [, digits = '0', suffix = ''] = /^(\d+)(.*)$/.exec(value) ?? [];
  const target = Number(digits);
  const slot = 1 / count;
  const at = (f: number) => (index + f) * slot;
  const first = index === 0;
  const last = index === count - 1;

  // Keyframes as [offset, opacity, y, scale]. The first stat is already on
  // stage when the pin engages, so it has no entrance; the last stays put
  // while the track runs out, so it has no exit.
  const keys: [number, number, string, number][] = [];
  if (!first) keys.push([at(ENTER[0]), 0, '16vh', 0.92], [at(ENTER[1]), 1, '0vh', 1]);
  if (!last) keys.push([at(EXIT[0]), 1, '0vh', 1], [at(EXIT[1]), 0, '-12vh', 1.04]);
  if (!keys.length) keys.push([0.5, 1, '0vh', 1]);
  const inputs = keys.map((k) => k[0]);
  const opacity = useScrub(progress, inputs, keys.map((k) => k[1]));
  const y = useScrub(progress, inputs, keys.map((k) => k[2]));
  const scale = useScrub(progress, inputs, keys.map((k) => k[3]));

  // The count runs from the moment the stat arrives until a little past the
  // middle of its slot, so the final figure always gets a long hold.
  const countFrom = first ? 0 : at(ENTER[0]);
  const shown = useScrub(progress, [countFrom, at(COUNT_END)], [0, target], { ease: expoOut });
  const numeral = useRef<HTMLSpanElement>(null);

  // Written straight to the DOM: a state update per scroll frame would
  // re-render the whole stat. The server renders the final figure, so a page
  // whose script never runs still tells the truth.
  const write = (v: number) => {
    if (numeral.current) numeral.current.textContent = String(Math.round(v));
  };
  useMotionValueEvent(shown, 'change', write);
  useEffect(() => write(shown.get()), [shown]);

  return (
    <m.div
      data-scrub
      className="[grid-area:1/1] pl-6 text-center sm:pl-0"
      style={{ opacity, y, scale }}
    >
      <p className="display-xl tracking-tight [font-variant-numeric:tabular-nums]">
        <span className="sr-only">{value}</span>
        <span aria-hidden="true">
          <span ref={numeral}>{target}</span>
          <span className="text-gold">{suffix}</span>
        </span>
      </p>
      <p className="mt-7 text-lg font-semibold uppercase tracking-[.2em] text-tone/80 sm:text-2xl lg:text-3xl">{label}</p>
    </m.div>
  );
}
