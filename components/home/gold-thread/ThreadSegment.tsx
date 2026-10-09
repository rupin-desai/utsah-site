'use client';

/**
 * One section's stretch of the gold thread. The thread is not one SVG over the
 * page: three home sections are pinned sticky stages, and a page-length overlay
 * would slide underneath them. So each section carries its own segment, and
 * the routes (routes.ts) hand off from one to the next at matching points.
 *
 * The drawing is calligraphic ink (geometry.ts): filled shapes that swell on
 * downstrokes and thin to hairlines on upstrokes, in a gold foil gradient.
 *
 * Cost is kept to the pen's tip. The ink is cut into short chunks, and each is
 * in one of three states: not reached (not painted), under the pen (revealed by
 * a small mask stroking along its centreline), or done (a plain fill, no mask).
 * So at most a couple of small masks are ever live, instead of one per stroke
 * the size of the section. One scroll listener drives it all straight on the
 * DOM: it writes only when a chunk changes state, plus the one dash under the
 * pen. Geometry is rebuilt only when the box resizes.
 */

import { useMotionValueEvent, useScroll, type MotionValue } from 'motion/react';
import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useStaticMotion } from '@/components/motion/scroll';
import { cn } from '@/lib/utils';
import { buildSegment, type Part, type ThreadRoute } from './layout';

export type ThreadSegmentProps = {
  desktop: ThreadRoute;
  /** Below COMPACT_MAX px of box width, where copy reaches the edges. Defaults to desktop. */
  compact?: ThreadRoute;
  /**
   * A pinned section passes its own track progress. Without it the segment
   * measures itself: the pen sits PEN of the way down the viewport.
   */
  progress?: MotionValue<number>;
  /** The share of `progress` the drawing spans. */
  range?: [number, number];
  className?: string;
};

const COMPACT_MAX = 1200;
const PEN = '65%';

/** Gold foil, light to deep: brighter on the dark ground, deeper on cream. */
const FOIL = {
  ink: ['#f3e2a6', '#d4b25a', '#a88433'],
  paper: ['#c9a84c', '#a8862f', '#7d5f1e'],
} as const;

/** Chunk states. */
const HIDDEN = 0;
const DRAWING = 1;
const DONE = 2;

export default function ThreadSegment({ desktop, compact, progress, range = [0, 1], className }: ThreadSegmentProps) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<[number, number]>([0, 0]);
  const [tone, setTone] = useState<keyof typeof FOIL>('ink');
  const isStatic = useStaticMotion();

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    // The section's own tone, not the canvas's: it is what this ink sits on.
    setTone(el.closest<HTMLElement>('[data-tone]')?.dataset.tone === 'paper' ? 'paper' : 'ink');
    // Resizes can arrive in bursts (fonts, images); rebuild at most once a frame.
    let frame = 0;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        setSize((s) => (Math.abs(s[0] - width) < 1 && Math.abs(s[1] - height) < 1 ? s : [width, height])),
      );
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, []);

  const { scrollYProgress: own } = useScroll({ target: box, offset: [`start ${PEN}`, `end ${PEN}`] });
  const source = progress ?? own;

  const [w, h] = size;
  const isCompact = w > 0 && w < COMPACT_MAX;
  const route = isCompact && compact ? compact : desktop;
  const parts = useMemo(() => (w > 0 && h > 0 ? buildSegment(route, w, h, isCompact) : []), [route, w, h, isCompact]);

  return (
    <div ref={box} aria-hidden="true" className={cn('pointer-events-none absolute inset-0', className)}>
      {parts.length ? (
        <Ink
          key={`${Math.round(w)}x${Math.round(h)}`}
          parts={parts}
          w={w}
          h={h}
          tone={tone}
          progress={source}
          range={range}
          isStatic={isStatic}
        />
      ) : null}
    </div>
  );
}

/** How much of a part is drawn at progress p, from its keyframes. */
function drawn(part: Part, p: number) {
  const { times, values } = part;
  if (p <= times[0]) return values[0];
  for (let i = 1; i < times.length; i++) {
    if (p <= times[i]) return values[i - 1] + ((p - times[i - 1]) / (times[i] - times[i - 1])) * (values[i] - values[i - 1]);
  }
  return values[values.length - 1];
}

type InkProps = {
  parts: Part[];
  w: number;
  h: number;
  tone: keyof typeof FOIL;
  progress: MotionValue<number>;
  range: [number, number];
  isStatic: boolean;
};

function Ink({ parts, w, h, tone, progress, range, isStatic }: InkProps) {
  // useId's punctuation is not safe inside url(#...).
  const id = `gt${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const foil = FOIL[tone];
  const fills = useRef<(SVGPathElement | null)[][]>(parts.map(() => []));
  const pens = useRef<(SVGPathElement | null)[][]>(parts.map(() => []));
  const states = useRef<number[][]>(parts.map((p) => p.chunks.map(() => -1)));

  const apply = useCallback(
    (v: number) => {
      const p = Math.min(1, Math.max(0, (v - range[0]) / (range[1] - range[0])));
      parts.forEach((part, i) => {
        const head = isStatic ? Infinity : drawn(part, p) * part.length;
        part.chunks.forEach((c, j) => {
          const fill = fills.current[i][j];
          if (!fill) return;
          const state = head >= c.s1 ? DONE : head <= c.s0 ? HIDDEN : DRAWING;
          if (state !== states.current[i][j]) {
            states.current[i][j] = state;
            fill.style.display = state === HIDDEN ? 'none' : '';
            if (state === DRAWING) fill.setAttribute('mask', `url(#${id}-${i}-${j})`);
            else fill.removeAttribute('mask');
          }
          if (state === DRAWING) {
            pens.current[i][j]?.setAttribute('stroke-dasharray', `${((head - c.s0) / (c.s1 - c.s0)).toFixed(4)} 2`);
          }
        });
      });
    },
    [parts, range, isStatic, id],
  );

  useMotionValueEvent(progress, 'change', apply);
  // Before paint: chunks start hidden, so nothing flashes before the first scroll.
  useLayoutEffect(() => apply(progress.get()), [apply, progress]);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 overflow-visible">
      <defs>
        {/* Left to right only: every segment is full width, so the foil's colour
            at any x is the same in every section and the line meets itself
            across a section boundary without a change of colour. */}
        <linearGradient id={`${id}-foil`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={w} y2="0">
          <stop offset="0" stopColor={foil[0]} />
          <stop offset=".5" stopColor={foil[1]} />
          <stop offset="1" stopColor={foil[2]} />
        </linearGradient>
        {parts.map((part, i) =>
          part.chunks.map((c, j) => (
            // Only referenced while its chunk is under the pen; bounded to the chunk.
            <mask key={`${i}-${j}`} id={`${id}-${i}-${j}`} maskUnits="userSpaceOnUse" x={c.box[0]} y={c.box[1]} width={c.box[2]} height={c.box[3]}>
              <path
                ref={(el) => {
                  pens.current[i][j] = el;
                }}
                d={c.center}
                fill="none"
                stroke="#fff"
                strokeWidth={part.maxWidth + 3}
                pathLength={1}
                strokeDasharray="0 2"
                // Butt caps: a zero-length dash paints nothing.
                strokeLinecap="butt"
                strokeLinejoin="round"
              />
            </mask>
          )),
        )}
      </defs>
      {parts.map((part, i) =>
        part.chunks.map((c, j) => (
          <path
            key={`${i}-${j}`}
            ref={(el) => {
              fills.current[i][j] = el;
            }}
            d={c.outline}
            fill={`url(#${id}-foil)`}
            style={{ display: 'none' }}
          />
        )),
      )}
    </svg>
  );
}
