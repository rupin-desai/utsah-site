'use client';

/**
 * The close: the opener's depth trick again, so the page begins and ends on
 * the same idea. The groom laughs through falling petals in front of a band
 * that runs the opposite way to the hero's. Not pinned — the layers separate
 * as the section rises into view and are at rest once it fills the screen.
 */

import type { ReactNode } from 'react';
import CurtainButton from '@/components/CurtainButton';
import { useInView, useScroll } from 'motion/react';
import { useRef } from 'react';
import DepthStage from '@/components/motion/DepthStage';
import { DISTANCE, Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';
import { Marquee } from '@/components/motion/scroll';
import { EYEBROW, EyebrowLabel } from '@/components/Eyebrow';
import ThreadSegment, { type ThreadSegmentProps } from '@/components/home/gold-thread/ThreadSegment';

export type DepthCloseProps = {
  index?: string;
  /** Chapter mark above the call to action; optional (the home page runs without). */
  eyebrow?: string;
  band: string[];
  /** Ways to get in touch, in one centred row just above the footer. */
  ctas: { href: string; label: string }[];
  /** The gold thread's finale (components/home/gold-thread). */
  thread?: Omit<ThreadSegmentProps, 'progress' | 'range'>;
  /** Laid over the foot of the scene: the home page's glass footer. */
  children?: ReactNode;
};

/**
 * Where the thread starts drawing in this section's progress: the previous
 * segment finishes as this section's top crosses the pen line, 65% down the
 * screen, which is 0.35 of the way from 'start end' to 'end end'.
 */
const THREAD_FROM = 0.35;

export default function DepthClose({ index, eyebrow, band, ctas, thread, children }: DepthCloseProps) {
  const section = useRef<HTMLElement>(null);
  // 0 as the section's top meets the bottom of the screen, 1 once it fills it.
  const { scrollYProgress } = useScroll({ target: section, offset: ['start end', 'end end'] });
  // The band rises word by word, like the hero's, once the scene is well in view.
  const bandIn = useInView(section, { once: true, amount: 0.45 });

  return (
    <section ref={section} data-tone="ink" className="relative h-svh min-h-[34rem] overflow-hidden text-white">
      <DepthStage
        bg="/assets/hero/layers/groom-bg.jpg"
        fg="/assets/hero/layers/groom-fg.webp"
        alt="A groom laughing through falling rose petals at his haldi"
        mode="parallax"
        objectPosition="50% 50%"
        // Cut-out trimmed tight to him (1522x1024: a long torso, no transparent
        // margin), bottom-anchored and sized by height. His torso is long enough
        // to run off the foot of the screen with the glass footer and the
        // contact row across it. Sized by the screen, not the section, so the
        // full-screen section shows the whole room around him: his crown sits
        // ~13svh from the top. Phones lift him, as
        // the footer stacks taller.
        subject={{ width: 1522, height: 1024, centerX: 0.5, raw: true, className: "h-[72svh] -translate-y-[18svh] sm:h-[108svh] sm:-translate-y-[11svh]" }}
        progress={scrollYProgress}
        intensity={0.6}
        middleClassName="top-[18%] sm:top-[12%]"
        middle={
          // The band is the section's heading; the hidden copy inside Marquee
          // is what screen readers announce.
          <h2>
            <Marquee items={band} loop={22} reverse entrance={{ show: bandIn, delay: 0.1, stagger: 0.06 }} className="font-sans text-[clamp(2.75rem,8.5vw,8rem)] font-light leading-[0.95] tracking-[-0.03em] text-white/90 [text-shadow:0_1px_24px_rgba(0,0,0,.35)]" />
          </h2>
        }
      />
      {/* The photo's top edge melts into the canvas, as the hero's foot does
          into the manifesto — no hard line where the reviews end. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-tone-bg to-transparent" />
      {/* Above the gradient, so the line arrives unbroken; the rings finish as
          the close fills the screen. */}
      {thread ? <ThreadSegment {...thread} progress={scrollYProgress} range={[THREAD_FROM, 1]} /> : null}
      {/* The way out, stacked from the foot of the scene: the contact row, then
          the glass footer (children). One column, so the gap between them holds
          whatever height the footer wraps to. */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-5 sm:gap-7">
        <div className="page-shell flex flex-col items-center [text-shadow:0_1px_24px_rgba(0,0,0,.35)]">
          {/* margin 0: this sits in the last stretch of the screen, below the
              default trigger line. */}
          {eyebrow ? (
            <Reveal as="p" className={`${EYEBROW} mb-8`} distance={DISTANCE.small} margin="0px">
              <EyebrowLabel index={index}>{eyebrow}</EyebrowLabel>
            </Reveal>
          ) : null}
          <RevealGroup margin="0px" className="flex flex-wrap justify-center gap-3 sm:gap-5">
            {ctas.map((c) => (
              <RevealItem key={c.href} distance={DISTANCE.small}>
                <CurtainButton href={c.href} caps className="bg-ink min-w-[9.5rem] justify-center sm:min-w-[12rem]">
                  {c.label}
                </CurtainButton>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
        {children}
      </div>
    </section>
  );
}
