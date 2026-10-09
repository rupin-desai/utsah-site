'use client';

/**
 * The close: the opener's depth trick again, so the page begins and ends on
 * the same idea. The groom laughs through falling petals in front of a band
 * that runs the opposite way to the hero's. Not pinned — the layers separate
 * as the section rises into view and are at rest once it fills the screen.
 */

import CurtainButton from '@/components/CurtainButton';
import { useScroll } from 'motion/react';
import { useRef } from 'react';
import DepthStage from '@/components/motion/DepthStage';
import { DISTANCE, Reveal } from '@/components/motion/reveal';
import { Marquee } from '@/components/motion/scroll';
import { EYEBROW, EyebrowLabel } from '@/components/Eyebrow';
import ThreadSegment, { type ThreadSegmentProps } from '@/components/home/gold-thread/ThreadSegment';

export type DepthCloseProps = {
  index?: string;
  /** Chapter mark above the call to action; optional (the home page runs without). */
  eyebrow?: string;
  band: string[];
  cta: { href: string; label: string };
  /** The gold thread's finale (components/home/gold-thread). */
  thread?: Omit<ThreadSegmentProps, 'progress' | 'range'>;
};

/**
 * Where the thread starts drawing in this section's progress: the previous
 * segment finishes as this section's top crosses the pen line, 65% down the
 * screen, which is 0.35 of the way from 'start end' to 'end end'.
 */
const THREAD_FROM = 0.35;

export default function DepthClose({ index, eyebrow, band, cta, thread }: DepthCloseProps) {
  const section = useRef<HTMLElement>(null);
  // 0 as the section's top meets the bottom of the screen, 1 once it fills it.
  const { scrollYProgress } = useScroll({ target: section, offset: ['start end', 'end end'] });

  return (
    <section ref={section} data-tone="ink" className="relative h-svh min-h-[34rem] overflow-hidden text-white">
      <DepthStage
        bg="/assets/hero/layers/groom-bg.jpg"
        fg="/assets/hero/layers/groom-fg.webp"
        alt="A groom laughing through falling rose petals at his haldi"
        objectPosition="47% 45%"
        progress={scrollYProgress}
        intensity={0.6}
        middleClassName="top-[30%] sm:top-[28%]"
        middle={
          // The band is the section's heading; the hidden copy inside Marquee
          // is what screen readers announce.
          <h2>
            <Marquee items={band} loop={22} reverse className="font-sans text-[clamp(2.75rem,8.5vw,8rem)] font-light leading-[0.95] tracking-[-0.03em] text-white/90 [text-shadow:0_1px_24px_rgba(0,0,0,.35)]" />
          </h2>
        }
        front={
          <div className="page-shell flex h-full flex-col justify-end pb-14 sm:pb-20 [text-shadow:0_1px_24px_rgba(0,0,0,.35)]">
            {/* margin 0: this copy sits in the last 15% of the screen, below the
                default trigger line, and would stay hidden while the close
                fills the viewport. */}
            {eyebrow ? (
              <Reveal as="p" className={`${EYEBROW} mb-8`} distance={DISTANCE.small} margin="0px">
                <EyebrowLabel index={index}>{eyebrow}</EyebrowLabel>
              </Reveal>
            ) : null}
            <Reveal delay={eyebrow ? 0.15 : 0} distance={DISTANCE.small} margin="0px">
              <CurtainButton href={cta.href} variant="solid" caps>
                {cta.label}
              </CurtainButton>
            </Reveal>
          </div>
        }
      />
      {/* The photo's top edge melts into the canvas, as the hero's foot does
          into the manifesto — no hard line where the reviews end. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-tone-bg to-transparent" />
      {/* Above the gradient, so the line arrives unbroken; the rings finish as
          the close fills the screen. */}
      {thread ? <ThreadSegment {...thread} progress={scrollYProgress} range={[THREAD_FROM, 1]} /> : null}
    </section>
  );
}
