'use client';

/**
 * Pinned stats. One number owns the screen at a time; scroll counts it up,
 * holds it, then hands over to the next. A gold glow drifts behind the stage
 * and a hairline rail on the left keeps score.
 *
 * Every stat lives in the same grid cell, so the stage is always exactly one
 * stat tall. Hand-overs are sequential, never a crossfade — two numerals this
 * size overlapping read as a smudge — so each stat leaves the stage a few
 * percent before the next one arrives.
 */

import { cubicBezier, m, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'motion/react';
import { useEffect, useRef } from 'react';
import { PinTrack, useScrub, useStaticMotion } from '@/components/motion/scroll';
import { EYEBROW, EyebrowLabel } from '@/components/Eyebrow';

/** The house expo-out, as an easing function for the count. */
const expoOut = cubicBezier(0.16, 1, 0.3, 1);

/** Fractions of one stat's slot. */
const ENTER = [0.04, 0.24] as const;
const EXIT = [0.78, 0.96] as const;
/** Where in its slot the count finishes. */
const COUNT_END = 0.55;

export type StatsSequenceProps = {
  index?: string;
  eyebrow: string;
  /** `["50k+", "Happy guests"]` — digits count, the rest is a static suffix. */
  stats: string[][];
};

export default function StatsSequence({ index, eyebrow, stats }: StatsSequenceProps) {
  const track = useRef<HTMLElement>(null);
  const isStatic = useStaticMotion();
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] });
  const glowX = useTransform(scrollYProgress, [0, 1], ['-18vw', '18vw']);
  const glowScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1.15, 0.9]);
  const rail = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <PinTrack
      trackRef={track}
      isStatic={isStatic}
      label={eyebrow}
      tone="ink"
      // ~80svh of scroll per stat on top of the one-screen stage.
      className="relative"
      style={{ height: `${100 + stats.length * 80}svh` }}
    >
      <div className="sticky top-0 isolate flex h-svh items-center overflow-hidden">
        <m.div
          aria-hidden="true"
          data-scrub
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -ml-[40vmax] -mt-[40vmax] size-[80vmax] rounded-full bg-[radial-gradient(closest-side,rgba(201,168,76,.28),rgba(201,168,76,.08)_45%,transparent)]"
          style={{ x: glowX, scale: glowScale }}
        />

        {/* The chapter mark sits where every other section's does: top left
            of the shell, not centred over the figure. */}
        <div className="page-shell absolute inset-x-0 top-28 sm:top-32">
          <p className={EYEBROW}>
            <EyebrowLabel index={index}>{eyebrow}</EyebrowLabel>
          </p>
        </div>

        {/* Score rail: a hairline that fills as the sequence plays. */}
        <div aria-hidden="true" data-rail className="absolute left-5 top-1/2 h-40 -translate-y-1/2 sm:left-8 lg:left-12">
          <div className="h-full w-px bg-tone/15" />
          <m.div data-scrub className="absolute inset-0 w-px origin-top bg-gold" style={{ scaleY: rail }} />
        </div>

        <div data-stack className="page-shell grid">
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
      <p className="font-display text-sm italic tracking-wide text-gold-light">
        No. {String(index + 1).padStart(2, '0')} <span className="text-tone/35">/ {String(count).padStart(2, '0')}</span>
      </p>
      <p className="display-xl mt-3 tracking-tight [font-variant-numeric:tabular-nums]">
        <span className="sr-only">{value}</span>
        <span aria-hidden="true">
          <span ref={numeral}>{target}</span>
          <span className="text-gold">{suffix}</span>
        </span>
      </p>
      <p className="mt-5 text-xs font-bold uppercase tracking-[.24em] text-tone/60">{label}</p>
    </m.div>
  );
}
