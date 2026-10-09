'use client';

/**
 * Pinned collage. Opens as a loose wall of frames; scrolling pushes the ring
 * outward while the centre frame opens to fill the screen, and the heading
 * lands on the photo's quiet sky.
 *
 * The centre is never scaled. It is a full-bleed image behind a clip-path that
 * starts as the centre cell's inset and opens to nothing, so the photo keeps
 * its true aspect at every frame. The image inside eases from 1.3x to 1x
 * against the opening clip — a counter-zoom that gives the move its depth.
 *
 * Text over the photo follows the house legibility rules: a bottom-up scrim,
 * no flat wash, and the heading set where the photo is quietest.
 */

import Image from 'next/image';
import { m, useScroll, type MotionValue } from 'motion/react';
import { useEffect, useRef } from 'react';
import { PinTrack, useScrub, useStaticMotion } from '@/components/motion/scroll';
import { EYEBROW, EyebrowLabel } from '@/components/Eyebrow';

/** Centre cell as a clip inset, in percent of the stage: [top/bottom, left/right]. */
const CENTRE = { y: 21, x: 35.5 };
/** Share of the track spent opening; the rest holds on the full frame. */
const OPEN_END = 0.62;
/**
 * From here the full-bleed frame dissolves into the canvas from the bottom up,
 * so the gallery that follows starts on the same paper instead of under a
 * hard photo edge.
 */
const DISSOLVE = 0.8;

/**
 * Ring frames. `box` is [top, left, width, height] in percent of the stage, laid
 * out as a 3x3 wall around the centre cell. Rows above and below run off the
 * stage on purpose — a wall that continues reads as larger than the screen.
 * `push` is how far each frame is flung, in multiples of its own size.
 */
const RING = [
  { src: '/assets/gallery/g01.jpeg', box: [-32, 4.5, 28, 50], push: [-0.9, -0.9] },
  { src: '/assets/gallery/g26.jpeg', box: [-32, 35.5, 29, 50], push: [0, -1.1] },
  { src: '/assets/gallery/g05.jpeg', box: [-32, 67.5, 28, 50], push: [0.9, -0.9] },
  { src: '/assets/gallery/g13.jpeg', box: [21, 4.5, 28, 58], push: [-1.2, 0] },
  { src: '/assets/gallery/g14.jpeg', box: [21, 67.5, 28, 58], push: [1.2, 0] },
  { src: '/assets/gallery/g09.jpeg', box: [82, 4.5, 28, 50], push: [-0.9, 0.9] },
  { src: '/assets/gallery/g17.jpeg', box: [82, 35.5, 29, 50], push: [0, 1.1] },
  { src: '/assets/gallery/g06.jpeg', box: [82, 67.5, 28, 50], push: [0.9, 0.9] },
] as const;

export type CollageMedia =
  | { kind: 'image'; src: string; position?: string }
  | { kind: 'video'; src: string; poster: string };

export type CollageZoomProps = {
  index?: string;
  eyebrow: string;
  title: string;
  media: CollageMedia;
};

export default function CollageZoom({ index, eyebrow, title, media }: CollageZoomProps) {
  const track = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const isStatic = useStaticMotion();
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] });

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

  // Same token structure at both ends, or Motion cannot interpolate the string.
  const clipPath = useScrub(
    scrollYProgress,
    [0, OPEN_END],
    [`inset(${CENTRE.y}% ${CENTRE.x}% ${CENTRE.y}% ${CENTRE.x}% round 6px)`, 'inset(0% 0% 0% 0% round 0px)'],
  );
  const zoom = useScrub(scrollYProgress, [0, OPEN_END], [1.3, 1]);
  const scrim = useScrub(scrollYProgress, [OPEN_END - 0.12, OPEN_END], [0, 1]);
  const copyOpacity = useScrub(scrollYProgress, [OPEN_END - 0.02, OPEN_END + 0.14, DISSOLVE, DISSOLVE + 0.1], [0, 1, 1, 0]);
  const dissolve = useScrub(scrollYProgress, [DISSOLVE, 1], ['100%', '0%']);
  const copyY = useScrub(scrollYProgress, [OPEN_END - 0.02, OPEN_END + 0.18], ['48px', '0px']);

  return (
    <PinTrack
      trackRef={track}
      isStatic={isStatic}
      label={title}
      tone="paper"
      className="relative h-[280svh]"
    >
      <div data-stage className="sticky top-0 h-svh overflow-hidden">
        {RING.map((frame) => (
          <RingFrame key={frame.src} {...frame} progress={scrollYProgress} />
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
          className="page-shell absolute inset-x-0 top-28 text-white sm:top-32"
          style={{ opacity: copyOpacity, y: copyY }}
        >
          <p className={`${EYEBROW} [text-shadow:0_1px_24px_rgba(0,0,0,.35)]`}>
            <EyebrowLabel index={index}>{eyebrow}</EyebrowLabel>
          </p>
          <h2 className="display-lg mt-5 max-w-3xl text-balance [text-shadow:0_1px_24px_rgba(0,0,0,.35)]">
            {title}
          </h2>
        </m.div>
      </div>
    </PinTrack>
  );
}

type RingFrameProps = (typeof RING)[number] & { progress: MotionValue<number> };

function RingFrame({ src, box: [top, left, width, height], push: [px, py], progress }: RingFrameProps) {
  // Percent translate resolves against the frame itself, so the push scales
  // with the layout and needs no measuring.
  const x = useScrub(progress, [0, OPEN_END], ['0%', `${px * 100}%`]);
  const y = useScrub(progress, [0, OPEN_END], ['0%', `${py * 100}%`]);
  const opacity = useScrub(progress, [OPEN_END * 0.45, OPEN_END * 0.9], [1, 0]);

  return (
    <m.div
      data-scrub
      data-ring
      className="absolute overflow-hidden rounded-[6px] bg-tone/10"
      style={{ top: `${top}%`, left: `${left}%`, width: `${width}%`, height: `${height}%`, x, y, opacity }}
    >
      <Image src={src} alt="" fill sizes="30vw" className="object-cover" />
    </m.div>
  );
}
