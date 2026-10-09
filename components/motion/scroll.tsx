'use client';

/**
 * Scroll-driven primitives. The counterpart to reveal.tsx: those play once on
 * entry, these are scrubbed — their state is a pure function of scroll
 * position, so they run backwards when the reader does.
 *
 * Shared rules:
 *   - transform / opacity / clip-path only, straight from motion values, so
 *     nothing here re-renders React per frame
 *   - every scrubbed element carries `data-scrub`; globals.css forces it to its
 *     resting state when motion is off, scripting is off, or the section is
 *     marked `data-static` (reduced motion)
 *   - pinned sections are a tall `data-pin` track holding one `sticky` stage.
 *     Nothing above a stage may set overflow: hidden, or sticky silently stops.
 */

import {
  m,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from 'motion/react';
import { Fragment, useEffect, useState, type CSSProperties, type ReactNode, type Ref } from 'react';
import { cn } from '@/lib/utils';

/**
 * Reduced motion, but `false` until after hydration. Scrubbed sections swap to
 * their static layout on this flag; reading the media query during the first
 * render would make the server and client markup disagree.
 */
export function useStaticMotion(): boolean {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && !!reduce;
}

/**
 * `useTransform` for a 0..1 scroll progress, padded to span the whole track.
 *
 * Motion hands scroll-linked opacity / clip-path / transform to a native
 * ScrollTimeline animation whose keyframe offsets are the input range. Outside
 * those offsets the native animation does not hold its end value — the layer
 * snaps back to a stale one. Padding the range out to exactly 0 and 1 with the
 * end values held flat keeps every frame of the track covered. Inputs must
 * rise strictly and sit inside [0, 1]; WAAPI throws otherwise.
 */
export function useScrub<T extends number | string>(
  progress: MotionValue<number>,
  input: number[],
  output: T[],
  options?: { ease?: (v: number) => number },
): MotionValue<T> {
  const ins = [...input];
  const outs = [...output];
  if (ins[0] > 0) {
    ins.unshift(0);
    outs.unshift(outs[0]);
  }
  if (ins[ins.length - 1] < 1) {
    ins.push(1);
    outs.push(outs[outs.length - 1]);
  }
  return useTransform(progress, ins, outs, options);
}

/** Wraps `v` into [min, max) — the marquee's seamless loop. */
const wrap = (min: number, max: number, v: number) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

/** Copies of the phrase in the track. The loop travels exactly one copy. */
const COPIES = 4;

export type MarqueeProps = {
  /** Phrases, joined by the gold diamond. Rendered once for screen readers. */
  items: string[];
  /** Seconds for one copy to pass at rest. */
  loop?: number;
  /** Run left-to-right instead. */
  reverse?: boolean;
  className?: string;
};

/**
 * Infinite type band. Drifts on its own, then surges with scroll velocity and
 * follows the scroll direction — the page feels like it has momentum.
 *
 * The track holds COPIES identical runs and loops over the first 1/COPIES of
 * its width, so the seam is never visible. Inline spans only, so it can sit
 * inside an <h2>.
 */
export function Marquee({ items, loop = 28, reverse = false, className }: MarqueeProps) {
  const reduce = useReducedMotion();
  const base = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  // px/s of scroll -> extra multiples of the resting speed. Capped, or a
  // trackpad fling turns the band into a blur.
  const surge = useTransform(velocity, [-2400, 0, 2400], [-5, 0, 5], { clamp: true });
  const x = useTransform(base, (v) => `${wrap(-100 / COPIES, 0, v)}%`);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    const s = surge.get();
    // Scrolling up reverses the band; scrolling down speeds it along its way.
    const direction = s < 0 ? -1 : 1;
    const perSecond = (100 / COPIES / loop) * (reverse ? 1 : -1);
    base.set(base.get() + perSecond * direction * (1 + Math.abs(s)) * (delta / 1000));
  });

  const run = (
    <span className="flex shrink-0 items-center">
      {items.map((item) => (
        <Fragment key={item}>
          <span className="px-[0.35em]">{item}</span>
          <span className="inline-block size-[0.14em] rotate-45 bg-gold" />
        </Fragment>
      ))}
    </span>
  );

  return (
    // Clip the loop sideways only. Clipping both axes cuts ascenders and
    // descenders off any band set tighter than its glyphs (leading < ~1.2);
    // overflow-x: clip, unlike hidden, leaves the y axis visible.
    <span className={cn('block overflow-x-clip whitespace-nowrap', className)}>
      <span className="sr-only">{items.join(', ')}</span>
      <m.span aria-hidden="true" data-scrub className="flex w-max will-change-transform" style={{ x }}>
        {Array.from({ length: COPIES }, (_, i) => (
          <Fragment key={i}>{run}</Fragment>
        ))}
      </m.span>
    </span>
  );
}

/**
 * The tall outer track of a pinned section. Owns the `data-pin` / `data-static`
 * hooks globals.css keys its fallbacks on, so no call site can forget one.
 */
export function PinTrack({
  className,
  style,
  children,
  tone,
  overlap = false,
  isStatic,
  label,
  id,
  trackRef,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  /** The canvas tone this section asks for (components/motion/ToneCanvas.tsx). */
  tone: 'ink' | 'paper';
  /** Marks a track pulled up over the previous one, for the no-JS fallback. */
  overlap?: boolean;
  isStatic: boolean;
  label?: string;
  id?: string;
  trackRef: Ref<HTMLElement>;
}) {
  return (
    <section
      ref={trackRef}
      id={id}
      aria-label={label}
      data-pin
      data-tone={tone}
      data-overlap={overlap || undefined}
      data-static={isStatic || undefined}
      className={className}
      style={style}
    >
      {children}
    </section>
  );
}
