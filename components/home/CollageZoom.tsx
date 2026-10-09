'use client';

/**
 * Pinned collage, in two movements.
 *
 * Explore: a tall wall of frames, three columns of six, deals itself onto the
 * screen in a diagonal wave the first time it is seen, top row whole, then
 * scrolls up through the stage, the side columns drifting at their own speeds
 * for depth. The film sits in the fourth row of the middle column, so the
 * reader browses the wall before reaching it.
 *
 * Open: once the film's frame reaches the middle of the screen, it opens to
 * fill it while every other frame is pushed outward and fades, and the heading
 * lands on the footage. Then the full frame dissolves into the ground below.
 *
 * The film is never scaled or moved. It is full-bleed behind a clip-path that,
 * during the explore, tracks its frame's on-screen rect exactly (a window
 * travelling over the footage), and during the open eases out to nothing. The
 * footage itself counter-zooms from 1.3x to 1x against the opening clip.
 *
 * Text over the footage follows the house legibility rules: a bottom-up scrim,
 * no flat wash, the heading where the frame is quietest.
 */

import Image from 'next/image';
import { m, useInView, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { useEffect, useRef } from 'react';
import { EASE_OUT } from '@/components/motion/reveal';
import { PinTrack, useScrub, useStaticMotion } from '@/components/motion/scroll';
import { EYEBROW, EyebrowLabel } from '@/components/Eyebrow';

/** The track, in svh: one stage plus the scroll the two movements play over. */
const TRACK = 480;
/** Progress: the wall has scrolled the film to centre / the film is fully open / the dissolve begins. */
const EXPLORE_END = 0.45;
const OPEN_END = 0.72;
const DISSOLVE = 0.86;
/** The first-view entrance: seconds between rows and between columns of the wave. */
const DEAL_ROW = 0.11;
const DEAL_COL = 0.07;

/**
 * The wall. Columns are [left %, width %]; frames are [top svh, height svh] in
 * wall space (the stage is 100svh, so svh and stage-% agree). The top row
 * starts 8svh down, whole on screen. `speed` is each column's share of the
 * wall's travel: the side columns drift a little faster and slower.
 */
const COLUMNS = [
  {
    x: 4.5,
    w: 28,
    speed: 1.1,
    frames: [
      { src: '/assets/gallery/g01.jpeg', top: 8, h: 50 },
      { src: '/assets/gallery/g16.jpeg', top: 62, h: 38 },
      { src: '/assets/gallery/g09.jpeg', top: 104, h: 46 },
      { src: '/assets/gallery/g25.jpeg', top: 154, h: 40 },
      { src: '/assets/gallery/g26.jpeg', top: 198, h: 46 },
      { src: '/assets/gallery/g04.jpeg', top: 248, h: 40 },
    ],
  },
  {
    x: 35.5,
    w: 29,
    speed: 1,
    frames: [
      { src: '/assets/gallery/g20.jpeg', top: 8, h: 40 },
      { src: '/assets/gallery/g13.jpeg', top: 52, h: 44 },
      { src: '/assets/gallery/g06.jpeg', top: 100, h: 40 },
      // The film's frame: FILM below.
      { src: '', top: 144, h: 58 },
      { src: '/assets/gallery/g17.jpeg', top: 206, h: 40 },
      { src: '/assets/gallery/g24.jpeg', top: 250, h: 38 },
    ],
  },
  {
    x: 67.5,
    w: 28,
    speed: 0.92,
    frames: [
      { src: '/assets/gallery/g05.jpeg', top: 8, h: 52 },
      { src: '/assets/gallery/g22.jpeg', top: 64, h: 40 },
      { src: '/assets/gallery/g18.jpeg', top: 108, h: 56 },
      { src: '/assets/gallery/g10.jpeg', top: 168, h: 36 },
      { src: '/assets/gallery/g11.jpeg', top: 208, h: 42 },
      { src: '/assets/gallery/g27.jpeg', top: 254, h: 36 },
    ],
  },
] as const;

/** The film's frame: middle column, fourth row. Its column moves at speed 1. */
const FILM = { col: 1, row: 3 } as const;
const FILM_FRAME = COLUMNS[FILM.col].frames[FILM.row];
const FILM_X = COLUMNS[FILM.col].x;
/** How far the wall travels to bring the film's frame to the middle of the screen, svh. */
const SHIFT = FILM_FRAME.top + FILM_FRAME.h / 2 - 50;

const clamp = (v: number) => Math.min(100, Math.max(0, v));
const r2 = (v: number) => Math.round(v * 100) / 100;

export type CollageMedia =
  | { kind: 'image'; src: string; position?: string }
  | { kind: 'video'; src: string; poster: string };

export type CollageZoomProps = {
  index?: string;
  /** Chapter mark above the title; optional (the home page runs without). */
  eyebrow?: string;
  title: string;
  media: CollageMedia;
};

export default function CollageZoom({ index, eyebrow, title, media }: CollageZoomProps) {
  const track = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const isStatic = useStaticMotion();
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] });
  // The wall deals itself in once, the first time the stage comes into view.
  const dealt = useInView(stage, { once: true, amount: 0.3 });

  // Footage plays only while the track is on screen — no decoding a
  // full-bleed video nobody can see.
  useEffect(() => {
    const el = video.current;
    const root = track.current;
    if (!el || !root) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) el.play().catch(() => {});
      else el.pause();
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  // The film's window. While the wall scrolls, it is the frame's rect on
  // screen (clamped to the stage while the frame is still below it); then it
  // eases out to the full stage. Same token structure throughout.
  const clipPath = useTransform(scrollYProgress, (p) => {
    if (p <= EXPLORE_END) {
      const shift = SHIFT * (p / EXPLORE_END);
      const top = clamp(FILM_FRAME.top - shift);
      const bottom = clamp(100 - (FILM_FRAME.top + FILM_FRAME.h - shift));
      return `inset(${r2(top)}% ${FILM_X}% ${r2(bottom)}% ${FILM_X}% round 6px)`;
    }
    const t = Math.min(1, (p - EXPLORE_END) / (OPEN_END - EXPLORE_END));
    const y = (50 - FILM_FRAME.h / 2) * (1 - t);
    const x = FILM_X * (1 - t);
    return `inset(${r2(y)}% ${r2(x)}% ${r2(y)}% ${r2(x)}% round ${r2(6 * (1 - t))}px)`;
  });
  const zoom = useScrub(scrollYProgress, [EXPLORE_END, OPEN_END], [1.3, 1]);
  const scrim = useScrub(scrollYProgress, [OPEN_END - 0.1, OPEN_END], [0, 1]);
  const copyOpacity = useScrub(scrollYProgress, [OPEN_END - 0.02, OPEN_END + 0.08, DISSOLVE, DISSOLVE + 0.08], [0, 1, 1, 0]);
  const dissolve = useScrub(scrollYProgress, [DISSOLVE, 1], ['100%', '0%']);
  const copyY = useScrub(scrollYProgress, [OPEN_END - 0.02, OPEN_END + 0.12], ['48px', '0px']);

  return (
    <PinTrack trackRef={track} isStatic={isStatic} label={title} tone="ink" className="relative" style={{ height: `${TRACK}svh` }}>
      <div ref={stage} data-stage className="sticky top-0 h-svh overflow-hidden">
        {COLUMNS.map((column, c) => (
          <Column key={c} column={column} index={c} progress={scrollYProgress} dealt={dealt} />
        ))}

        <m.div data-scrub data-centre className="absolute inset-0" style={{ clipPath }}>
          <m.div data-scrub className="absolute inset-0" style={{ scale: zoom }}>
            {media.kind === 'video' ? (
              <video
                ref={video}
                muted
                loop
                playsInline
                preload="metadata"
                poster={media.poster}
                className="size-full object-cover"
              >
                <source src={media.src} type="video/mp4" />
              </video>
            ) : (
              <Image src={media.src} alt="" fill sizes="100vw" className="object-cover" style={{ objectPosition: media.position }} />
            )}
          </m.div>
          {/* Bottom-up scrim: legibility for the copy, the sky left untouched. */}
          <m.div
            data-scrub
            className="absolute inset-0 bg-[linear-gradient(to_top,rgba(11,11,11,.7),transparent_55%)]"
            style={{ opacity: scrim }}
          />
          {/* The dissolve: a tone-coloured ground rising from below. Slid, not
              resized, so it stays a compositor-only transform. */}
          <m.div
            data-scrub
            className="absolute inset-0 bg-gradient-to-t from-tone-bg from-30% to-transparent"
            style={{ y: dissolve }}
          />
        </m.div>

        <m.div
          data-scrub
          className="page-shell absolute inset-x-0 top-28 text-center text-white sm:top-32"
          style={{ opacity: copyOpacity, y: copyY }}
        >
          {eyebrow ? (
            <p className={`${EYEBROW} mb-5 justify-center [text-shadow:0_1px_24px_rgba(0,0,0,.35)]`}>
              <EyebrowLabel index={index}>{eyebrow}</EyebrowLabel>
            </p>
          ) : null}
          <h2 className="display-lg mx-auto max-w-3xl text-balance text-center [text-shadow:0_1px_24px_rgba(0,0,0,.35)]">
            {title}
          </h2>
        </m.div>
      </div>
    </PinTrack>
  );
}

type ColumnProps = {
  column: (typeof COLUMNS)[number];
  index: number;
  progress: MotionValue<number>;
  dealt: boolean;
};

/** One column of the wall, travelling up at its own speed through the explore. */
function Column({ column, index, progress, dealt }: ColumnProps) {
  const y = useScrub(progress, [0, EXPLORE_END], ['0svh', `${-r2(SHIFT * column.speed)}svh`]);
  return (
    <m.div data-scrub className="absolute inset-0" style={{ y }}>
      {column.frames.map((frame, row) =>
        index === FILM.col && row === FILM.row ? null : (
          <Frame
            key={frame.src}
            frame={frame}
            x={column.x}
            w={column.w}
            speed={column.speed}
            progress={progress}
            dealt={dealt}
            delay={row * DEAL_ROW + index * DEAL_COL}
          />
        ),
      )}
    </m.div>
  );
}

type FrameProps = {
  frame: { src: string; top: number; h: number };
  x: number;
  w: number;
  speed: number;
  progress: MotionValue<number>;
  /** The wall's first-view entrance has been triggered. */
  dealt: boolean;
  /** This frame's place in the entrance wave, seconds. */
  delay: number;
};

/**
 * A photograph on the wall. On first view it is dealt in (rises, fades and
 * grows into place, on an inner layer so it never fights the scroll). When the
 * film opens, it is flung away from the film's frame (in multiples of its own
 * size, so it scales with the layout) and fades.
 */
function Frame({ frame, x, w, speed, progress, dealt, delay }: FrameProps) {
  const reduce = !!useReducedMotion();
  // Where it sits relative to the film's frame at the moment the film opens.
  const dx = x + w / 2 - (FILM_X + COLUMNS[FILM.col].w / 2);
  const dy = frame.top + frame.h / 2 - SHIFT * speed - 50;
  const len = Math.hypot(dx, dy) || 1;
  const px = (dx / len) * 1.2;
  const py = (dy / len) * 1.2;
  const pushX = useScrub(progress, [EXPLORE_END, OPEN_END], ['0%', `${r2(px * 100)}%`]);
  const pushY = useScrub(progress, [EXPLORE_END, OPEN_END], ['0%', `${r2(py * 100)}%`]);
  const opacity = useScrub(progress, [EXPLORE_END + 0.04, OPEN_END - 0.04], [1, 0]);

  return (
    <m.div
      data-scrub
      data-ring
      className="absolute overflow-hidden rounded-[6px] bg-tone/10"
      style={{ top: `${frame.top}svh`, left: `${x}%`, width: `${w}%`, height: `${frame.h}svh`, x: pushX, y: pushY, opacity }}
    >
      <m.div
        data-reveal
        className="absolute inset-0"
        initial={reduce ? false : { opacity: 0, y: 70, scale: 0.92 }}
        animate={dealt ? { opacity: 1, y: 0, scale: 1 } : undefined}
        transition={{ duration: 1.1, delay, ease: EASE_OUT }}
      >
        <Image src={frame.src} alt="" fill sizes="30vw" className="object-cover" />
      </m.div>
    </m.div>
  );
}
