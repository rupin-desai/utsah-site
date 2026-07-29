'use client';

/**
 * Scroll-parallax gallery. Four columns drift against each other while the
 * section crosses the viewport.
 *
 * Percentages, not measured pixels: `y` in percent resolves against the
 * column's own height, so there is no resize listener, no `useState` for
 * viewport size, and nothing to re-measure after an image decodes or the
 * mobile URL bar collapses. It is also correct on the server render, where a
 * measured height would be 0 and every column would sit flat.
 *
 * The geometry is one invariant: a column is OVERFLOW taller than its frame
 * and centred, so it has OVERFLOW/2 of hidden slack at each end. Expressed in
 * the column's own units that slack is (OVERFLOW/2) / (1 + OVERFLOW), and no
 * entry in DRIFT may exceed it or the end of a column swings into the frame.
 */

import Image from 'next/image';
import { m, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { useRef } from 'react';

/** Top-to-bottom within each column. */
const COLUMNS = [
  ['/assets/gallery/g27.jpeg', '/assets/gallery/g04.jpeg', '/assets/gallery/g16.jpeg'],
  ['/assets/gallery/g12.jpeg', '/assets/gallery/g21.jpeg', '/assets/gallery/g07.jpeg'],
  ['/assets/gallery/g19.jpeg', '/assets/gallery/g02.jpeg', '/assets/gallery/g24.jpeg'],
  ['/assets/gallery/g15.jpeg', '/assets/gallery/g10.jpeg', '/assets/gallery/g08.jpeg'],
];

/** Columns 3 and 4 would crush the frames on a phone. */
const COLUMN_VISIBILITY = ['flex', 'flex', 'hidden md:flex', 'hidden lg:flex'];

/** Fraction of the frame's height added to each column. */
const OVERFLOW = 0.4;

/**
 * Percent of a column's own height travelled across the section's full pass.
 * Alternating sign is what makes neighbouring columns visibly slide against
 * each other; a shared direction only reads as "the page scrolled".
 * Ceiling here is (OVERFLOW/2) / (1 + OVERFLOW) = 14.2%.
 */
const DRIFT = [9, -13, 11, -8];

export default function ParallaxGallery() {
  const frame = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // "start end" -> "end start": progress runs 0..1 over the whole time any
  // part of the section is on screen, so the drift never jumps at either edge.
  const { scrollYProgress } = useScroll({
    target: frame,
    offset: ['start end', 'end start'],
  });

  return (
    <div
      ref={frame}
      className="relative h-[110vh] overflow-hidden sm:h-[130vh] lg:h-[150vh]"
    >
      <div className="flex h-full gap-3 px-3 sm:gap-4 sm:px-4">
        {COLUMNS.map((images, i) => (
          <Column
            key={i}
            images={images}
            progress={scrollYProgress}
            drift={reduce ? 0 : DRIFT[i]}
            className={COLUMN_VISIBILITY[i]}
          />
        ))}
      </div>
      {/* Cropped frames fade into the section instead of ending on a hard cut. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-paper to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-paper to-transparent" />
    </div>
  );
}

type ColumnProps = {
  images: string[];
  progress: MotionValue<number>;
  /** Percent of this column's height. 0 disables the parallax outright. */
  drift: number;
  className?: string;
};

function Column({ images, progress, drift, className }: ColumnProps) {
  const y = useTransform(progress, [0, 1], [`${drift}%`, `${-drift}%`]);

  return (
    <m.div
      style={{ y, height: `${(1 + OVERFLOW) * 100}%`, top: `${(-OVERFLOW / 2) * 100}%` }}
      className={`relative flex-1 flex-col gap-3 sm:gap-4 ${className ?? ''}`}
    >
      {images.map((src) => (
        <div key={src} className="relative flex-1 overflow-hidden bg-stone-200">
          <Image
            src={src}
            alt="Utsah event celebration"
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        </div>
      ))}
    </m.div>
  );
}
