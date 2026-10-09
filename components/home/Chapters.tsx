'use client';

/**
 * "What we create": one chapter per event type, each pinned in turn. A
 * chapter arrives, holds the screen while its stretch of the gold thread draws
 * its motif over it (arch, wreath, microphone; gold-thread/routes.ts,
 * CHAPTER_THREAD), then scrolls away before the next one arrives. No stacking:
 * one chapter on screen at a time.
 *
 * Each chapter is the same pinned pattern as the manifesto and the stats: a
 * tall PinTrack holding one sticky, full-screen stage, with its thread segment
 * inside the stage so the motif draws in place. A segment leaves the bottom of
 * its stage at the x the next one enters at, so the line reads as one thread.
 * PinTrack also brings the reduced-motion and no-JS fallbacks (globals.css,
 * [data-pin]).
 */

import Image from 'next/image';
import { m, useInView, useReducedMotion, useScroll, type Transition } from 'motion/react';
import { Fragment, useRef, useState } from 'react';
import CurtainButton from '@/components/CurtainButton';
import ThreadSegment from '@/components/home/gold-thread/ThreadSegment';
import { CHAPTER_THREAD } from '@/components/home/gold-thread/routes';
import { EASE_OUT, RiseWord } from '@/components/motion/reveal';
import { PinTrack, useStaticMotion } from '@/components/motion/scroll';
import { cn } from '@/lib/utils';

export type Chapter = {
  href: string;
  title: string;
  text: string;
  image: string;
  gallery: string[];
  stat?: [string, string];
};

/**
 * svh of scroll each chapter holds the screen for, on top of its one-screen
 * stage: long enough for its motif to draw in full before it lets go.
 */
const DWELL = 170;

/**
 * The entrance, one sentence, seconds from the trigger. The photo leads (a
 * curtain rising off it while the image settles from a push-in), the title
 * rises word by word out of its mask, the description ripples up after it,
 * the thumbnails rise in one by one, and the button lands
 * last. One trigger for all of it, so the timing is exact.
 */
const CUE = {
  photo: 0,
  title: 0.3,
  titleStep: 0.08,
  text: 0.55,
  textStep: 0.018,
  thumbs: 0.75,
  thumbStep: 0.11,
  cta: 1.25,
};

export default function Chapters({ chapters }: { chapters: Chapter[] }) {
  return (
    <>
      {chapters.map((chapter) => (
        <ChapterTrack key={chapter.href} chapter={chapter} />
      ))}
    </>
  );
}

function ChapterTrack({ chapter }: { chapter: Chapter }) {
  const track = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const isStatic = useStaticMotion();
  const reduce = !!useReducedMotion();
  // Same pen line as every other segment: draws from the moment the stage's
  // top edge crosses 65% down the screen until the pin lets go.
  const { scrollYProgress } = useScroll({ target: track, offset: ['start 65%', 'end end'] });
  // The entrance plays once, as the stage settles into view.
  const show = useInView(stage, { once: true, amount: 0.6 });
  const [active, setActive] = useState(-1);
  const photos = [chapter.image, ...chapter.gallery];
  const shown = active + 1;
  const thread = CHAPTER_THREAD[chapter.href];
  const at = (delay: number, duration: number): Transition => (reduce ? { duration: 0 } : { duration, delay, ease: EASE_OUT });
  // Reduced motion starts every element at rest, so nothing moves.
  const from = <T,>(v: T) => (reduce ? false : v);

  return (
    <PinTrack
      trackRef={track}
      isStatic={isStatic}
      tone="ink"
      label={chapter.title}
      className="relative"
      style={{ height: `${100 + DWELL}svh` }}
    >
      <div ref={stage} className="sticky top-0 flex h-svh items-center">
        {/* Above the spread, never in the way of a click: overlaps are the point. */}
        {thread ? <ThreadSegment {...thread} progress={scrollYProgress} className="z-10" /> : null}

        {/* Full bleed: the photo runs to the page's left edge (edge to edge on
            phones); only the story keeps a margin. */}
        <div className="relative grid h-[84svh] w-full grid-rows-[36%_1fr] lg:h-[78svh] lg:grid-cols-[1.35fr_1fr] lg:grid-rows-1">
          {/* The photo: a curtain rises off it while the image inside settles
              from a push-in. Every frame is stacked; the chosen one fades in. */}
          <m.div
            data-reveal
            className="relative overflow-hidden"
            initial={from({ clipPath: 'inset(100% 0% 0% 0%)' })}
            animate={show ? { clipPath: 'inset(0% 0% 0% 0%)' } : undefined}
            transition={at(CUE.photo, 1.4)}
          >
            <m.div
              data-reveal
              className="absolute inset-0"
              initial={from({ scale: 1.3 })}
              animate={show ? { scale: 1 } : undefined}
              transition={at(CUE.photo, 1.9)}
            >
              {photos.map((src, j) => (
                <Image
                  key={src}
                  src={src}
                  alt={j === 0 ? `${chapter.title} by Utsah` : ''}
                  fill
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className={cn('object-cover transition-opacity duration-500', j === shown ? 'opacity-100' : 'opacity-0')}
                  // Only the cover loads up front; the rest when first chosen.
                  loading={j === 0 ? undefined : 'lazy'}
                />
              ))}
            </m.div>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_62%,rgba(11,11,11,.9))] max-lg:bg-[linear-gradient(to_bottom,transparent_62%,rgba(11,11,11,.9))]" />
          </m.div>

          <div className="flex min-h-0 flex-col justify-end px-5 pt-6 sm:px-8 lg:pb-2 lg:pl-12 lg:pr-12 lg:pt-0">
            {/* Word by word, each out of its own mask. */}
            <h3 className="display max-w-[70%] text-[clamp(2.2rem,3.6vw,3.75rem)] leading-[1.02] lg:max-w-none">
              {chapter.title.split(' ').map((word, i) => (
                <Fragment key={i}>
                  {i > 0 ? ' ' : null}
                  <RiseWord show={show} delay={CUE.title + i * CUE.titleStep} duration={1}>
                    {word}
                  </RiseWord>
                </Fragment>
              ))}
            </h3>
            {/* A faster ripple of words, following the title. */}
            <p className="mt-4 max-w-md text-sm leading-6 text-tone/75 max-lg:line-clamp-3 sm:text-base sm:leading-7">
              {chapter.text.split(' ').map((word, i) => (
                <Fragment key={i}>
                  {i > 0 ? ' ' : null}
                  <RiseWord show={show} delay={CUE.text + i * CUE.textStep} duration={0.8}>
                    {word}
                  </RiseWord>
                </Fragment>
              ))}
            </p>

            {/* Thumbnails: choose a frame for the photo. A snap strip on narrow
                screens. Each rises into place in turn, straight up. */}
            <div className="-mx-1 mt-6 flex snap-x gap-2.5 overflow-x-auto px-1 pb-1 scrollbar-none lg:overflow-visible">
              {chapter.gallery.map((src, j) => (
                <m.div
                  key={src}
                  data-reveal
                  className="w-20 shrink-0 snap-start origin-bottom sm:w-24 lg:w-[22%]"
                  initial={from({ opacity: 0, y: 80, scale: 0.86 })}
                  animate={show ? { opacity: 1, y: 0, scale: 1 } : undefined}
                  transition={at(CUE.thumbs + j * CUE.thumbStep, 1.1)}
                >
                  <button
                    type="button"
                    aria-label={`Show photo ${j + 2} of ${chapter.title}`}
                    aria-pressed={active === j}
                    onClick={() => setActive((a) => (a === j ? -1 : j))}
                    className={cn(
                      'relative block aspect-4/3 w-full overflow-hidden rounded-[4px] border transition duration-300',
                      'hover:-translate-y-1 hover:border-gold/70 focus-visible:outline-2 focus-visible:outline-gold',
                      active === j ? 'border-gold' : 'border-tone/15 opacity-70 hover:opacity-100',
                    )}
                  >
                    <Image src={src} alt="" fill sizes="120px" className="object-cover" />
                  </button>
                </m.div>
              ))}
            </div>

            <m.div
              data-reveal
              className="mt-7"
              initial={from({ opacity: 0, y: 36 })}
              animate={show ? { opacity: 1, y: 0 } : undefined}
              transition={at(CUE.cta, 0.9)}
            >
              <CurtainButton href={chapter.href} caps>
                Explore {chapter.title.toLowerCase()}
              </CurtainButton>
            </m.div>
          </div>
        </div>
      </div>
    </PinTrack>
  );
}
