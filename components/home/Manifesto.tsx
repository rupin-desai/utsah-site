'use client';

/**
 * Pinned manifesto. The stage holds still while the copy lights up word by
 * word under the reader's thumb, then the links settle in underneath.
 *
 * Each word owns a short window of the track's progress and fades from a
 * ghost to full ink across it. Windows overlap by OVERLAP words, so the light
 * reads as a soft front moving through the sentence rather than a cursor.
 */

import CurtainButton from '@/components/CurtainButton';
import { m, useScroll, useTransform, type MotionValue } from 'motion/react';
import { useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { PinTrack, useScrub, useStaticMotion } from '@/components/motion/scroll';
import { EYEBROW, EyebrowLabel } from '@/components/Eyebrow';
import ThreadSegment, { type ThreadSegmentProps } from '@/components/home/gold-thread/ThreadSegment';

/** Words whose window may overlap the current one. */
const OVERLAP = 3;
/** Share of the track the copy uses; the rest is the hold before the links. */
const COPY_END = 0.78;
/**
 * With `overlap`, the track is pulled up by this much over the section before
 * it, so it slides up over that section's still-pinned stage instead of
 * following it. The previous track must be at least this much longer than its
 * pinned screen (DepthHero's 250svh).
 */
const SLIDE_OVER = '-mt-[100svh]';

export type ManifestoProps = {
  id?: string;
  index?: string;
  /** Chapter mark above the copy; optional (the home page runs without). */
  eyebrow?: string;
  /** `*word*` renders as the gold italic accent. */
  copy: string;
  links: { href: string; label: string }[];
  /** Slide up over the previous section's pinned stage (see SLIDE_OVER). */
  overlap?: boolean;
  /** This section's stretch of the gold thread (components/home/gold-thread). */
  thread?: Omit<ThreadSegmentProps, 'progress'>;
};

export default function Manifesto({ id, index, eyebrow, copy, links, overlap = false, thread }: ManifestoProps) {
  const track = useRef<HTMLElement>(null);
  const isStatic = useStaticMotion();
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] });
  // The thread starts drawing as the sheet's edge crosses the pen line (65% down
  // the screen) and finishes as the pin lets go — where the next segment's
  // track is just arriving.
  const { scrollYProgress: threadProgress } = useScroll({ target: track, offset: ['start 65%', 'end end'] });

  // `*...*` may span several words, so the accent is a run, not a per-word test.
  const words = useMemo(() => {
    let inAccent = false;
    return copy.split(/\s+/).map((raw) => {
      if (raw.startsWith('*')) inAccent = true;
      const word = { text: raw.replace(/\*/g, ''), accent: inAccent };
      if (/\*[.,!?]?$/.test(raw)) inAccent = false;
      return word;
    });
  }, [copy]);

  const linksOpacity = useScrub(scrollYProgress, [COPY_END, COPY_END + 0.1], [0, 1]);
  const linksY = useScrub(scrollYProgress, [COPY_END, COPY_END + 0.12], ['24px', '0px']);
  const linksEvents = useTransform(linksOpacity, (v) => (v > 0.5 ? 'auto' : 'none'));

  return (
    <PinTrack
      id={id}
      trackRef={track}
      isStatic={isStatic}
      tone="ink"
      // Static motion collapses the previous pin, so there is nothing to slide
      // over; globals.css drops the margin for the no-JS case via data-overlap.
      overlap={overlap && !isStatic}
      className={cn('relative h-[240svh]', overlap && !isStatic && cn('z-10', SLIDE_OVER))}
    >
      {/* Opaque, unlike a normal toned section: it has to cover the stage it
          slides over. The shadow is the leading edge of the sheet. */}
      <div
        className={cn(
          'sticky top-0 flex h-svh items-center',
          overlap && 'bg-tone-bg shadow-[0_-40px_80px_-20px_rgba(0,0,0,.65)]',
        )}
      >
        {thread ? <ThreadSegment {...thread} progress={threadProgress} /> : null}
        {/* relative: keeps the copy painting above the thread. */}
        <div className="page-shell relative">
          {eyebrow ? (
            <p className={cn(EYEBROW, 'mb-8')}>
              <EyebrowLabel index={index}>{eyebrow}</EyebrowLabel>
            </p>
          ) : null}
          <p className="display-md max-w-5xl text-balance">
            <span className="sr-only">{words.map((w) => w.text).join(' ')}</span>
            <span aria-hidden="true">
              {words.map((word, i) => (
                <Word key={i} index={i} count={words.length} progress={scrollYProgress} {...word} />
              ))}
            </span>
          </p>
          <m.div
            data-scrub
            className="mt-14 flex flex-wrap gap-3"
            style={{ opacity: linksOpacity, y: linksY, pointerEvents: linksEvents }}
          >
            {links.map((link) => (
              <CurtainButton key={link.href} href={link.href}>
                {link.label}
              </CurtainButton>
            ))}
          </m.div>
        </div>
      </div>
    </PinTrack>
  );
}

type WordProps = {
  text: string;
  accent: boolean;
  index: number;
  count: number;
  progress: MotionValue<number>;
};

function Word({ text, accent, index, count, progress }: WordProps) {
  // Leave a sliver at the top so the first word is still a ghost on arrival.
  const step = (COPY_END - 0.04) / (count + OVERLAP);
  const start = 0.04 + index * step;
  const end = start + step * (OVERLAP + 1);
  const opacity = useScrub(progress, [start, end], [0.12, 1]);
  // A small lift as each word lands — felt more than seen.
  const y = useScrub(progress, [start, end], ['0.18em', '0em']);

  return (
    <>
      <m.span
        data-scrub
        className={accent ? 'inline-block italic text-gold' : 'inline-block'}
        style={{ opacity, y }}
      >
        {text}
      </m.span>{' '}
    </>
  );
}
