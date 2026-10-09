'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Reviews on the inside of a slowly turning drum. The reader stands in the
 * middle: the card in front faces them square on, the ones either side swing
 * round towards them and darken, and the back of the drum is never drawn
 * (backface-visibility). The camera sits a little above centre, so the cards'
 * feet curve up into a smile.
 *
 * GSAP drives it: the drum drifts on its own, surges with scroll velocity and
 * follows the scroll direction (the same momentum as the hero's type band), and
 * can be dragged and flung. The ticker only runs while the section is on
 * screen. Reduced motion: no drift or surge, but drag still works.
 *
 * Without JS the drum renders at its default size, standing still.
 */

type Review = readonly [name: string, quote: string];

export type ReviewRingProps = {
  /** Accessible name for the section; there is no visible heading. */
  label: string;
  reviews: readonly Review[];
};

/** deg/s at rest. */
const DRIFT = 6;
/** deg/s added per px/s of scroll, and its cap: a trackpad fling stays readable. */
const SURGE = 0.018;
const MAX_SURGE = 75;
/** s, how quickly the drum takes up a change of scroll speed. */
const EASE = 0.18;
/** Rest speed while a pointer is over the drum, so a card can be read. */
const HOVER_SLOW = 0.2;
/** Darkness of a card side-on to the reader. */
const SHADE = 0.55;

/** Drum geometry for a card width. Cards touch edge to edge round the circle, plus a gap. */
function geometry(cw: number, count: number) {
  const radius = (cw * 1.1) / 2 / Math.tan(Math.PI / count);
  // How far behind the screen the front card sits; the drum is pulled towards
  // the reader by the rest of its radius.
  const depth = cw * 0.55;
  return {
    cw,
    ch: cw * 1.08,
    radius,
    z: radius - depth,
    // Far enough back that the rear of the drum stays in front of the camera.
    perspective: 2 * radius - depth + cw * 1.5,
  };
}

const vars = (g: ReturnType<typeof geometry>) =>
  ({
    '--cw': `${g.cw}px`,
    '--ch': `${g.ch}px`,
    '--r': `${g.radius}px`,
    '--p': `${g.perspective}px`,
  }) as CSSProperties;

export default function ReviewRing({ label, reviews }: ReviewRingProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLUListElement>(null);
  const count = reviews.length;
  const step = 360 / count;
  const initial = geometry(280, count);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const ring = ringRef.current;
    if (!section || !stage || !ring) return;
    gsap.registerPlugin(ScrollTrigger);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const shades = gsap.utils.toArray<HTMLElement>('[data-shade]', ring);
    const setShade = shades.map((el) => gsap.quickSetter(el, 'opacity'));
    const setAngle = gsap.quickSetter(ring, 'rotationY', 'deg');

    let radius = initial.radius;
    const layout = () => {
      const g = geometry(gsap.utils.clamp(220, 300, stage.clientWidth * 0.2), count);
      radius = g.radius;
      for (const [k, v] of Object.entries(vars(g))) stage.style.setProperty(k, v as string);
      gsap.set(ring, { z: g.z });
    };
    layout();
    const resize = new ResizeObserver(layout);
    resize.observe(stage);

    const state = { hover: 1 };
    let angle = 0;
    let velocity = 0; // smoothed scroll velocity, px/s
    let direction = 1; // scrolling down turns the drum leftwards
    let fling = 0; // deg/s left over from a drag, decaying
    let lastY = window.scrollY;
    let dragging = false;

    const paint = () => {
      setAngle(angle);
      for (let i = 0; i < count; i++) {
        const a = ((i * step + angle) * Math.PI) / 180;
        setShade[i](Math.min(SHADE * 1.15, (1 - Math.cos(a)) * SHADE));
      }
    };

    const tick = (_time: number, deltaMs: number) => {
      const dt = Math.min(deltaMs, 100) / 1000;
      if (!dt) return;
      const y = window.scrollY;
      velocity += ((y - lastY) / dt - velocity) * Math.min(1, dt / EASE);
      lastY = y;
      if (Math.abs(velocity) > 40) direction = velocity > 0 ? 1 : -1;
      fling *= Math.exp(-dt * 2.5);
      if (!dragging) {
        const surge = reduce ? 0 : gsap.utils.clamp(-MAX_SURGE, MAX_SURGE, velocity * SURGE);
        angle += ((reduce ? 0 : DRIFT * direction * state.hover) + surge + fling) * dt;
      }
      paint();
    };

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: ({ isActive }) => {
        if (isActive) {
          lastY = window.scrollY;
          gsap.ticker.add(tick);
        } else gsap.ticker.remove(tick);
      },
    });
    paint();

    // Drag: one pixel moves the front card about one pixel. A vertical swipe on
    // touch still scrolls the page (touch-action: pan-y) and cancels the drag.
    let lastX = 0;
    let lastT = 0;
    let dragSpeed = 0;
    const degPerPx = () => 180 / (Math.PI * radius) / 0.85;
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      fling = 0;
      dragSpeed = 0;
      lastX = e.clientX;
      lastT = e.timeStamp;
      stage.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const d = -(e.clientX - lastX) * degPerPx();
      const dt = Math.max(1, e.timeStamp - lastT) / 1000;
      angle += d;
      dragSpeed = dragSpeed * 0.6 + (d / dt) * 0.4;
      lastX = e.clientX;
      lastT = e.timeStamp;
      if (!trigger.isActive) paint();
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      fling = gsap.utils.clamp(-240, 240, dragSpeed);
    };
    const enter = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') gsap.to(state, { hover: HOVER_SLOW, duration: 0.6, ease: 'power2.out' });
    };
    const leave = () => gsap.to(state, { hover: 1, duration: 0.8, ease: 'power2.inOut' });

    stage.addEventListener('pointerdown', down);
    stage.addEventListener('pointermove', move);
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', up);
    stage.addEventListener('pointerenter', enter);
    stage.addEventListener('pointerleave', leave);

    return () => {
      trigger.kill();
      gsap.ticker.remove(tick);
      gsap.killTweensOf(state);
      resize.disconnect();
      stage.removeEventListener('pointerdown', down);
      stage.removeEventListener('pointermove', move);
      stage.removeEventListener('pointerup', up);
      stage.removeEventListener('pointercancel', up);
      stage.removeEventListener('pointerenter', enter);
      stage.removeEventListener('pointerleave', leave);
    };
  }, [count, step, initial.radius]);

  return (
    <section ref={sectionRef} data-tone="ink" aria-label={label} className="relative py-10 sm:py-16">

      {/* The stage owns the perspective and fades the drum out at the page
          edges; the ring is the drum itself. */}
      <div
        ref={stageRef}
        className="relative h-[calc(var(--ch)*1.45)] cursor-grab touch-pan-y select-none overflow-x-clip [mask-image:linear-gradient(90deg,transparent,#000_14%,#000_86%,transparent)] [perspective-origin:50%_18%] [perspective:var(--p)] active:cursor-grabbing"
        style={vars(initial)}
      >
        <ul
          ref={ringRef}
          aria-label="Client reviews"
          className="absolute left-1/2 top-[42%] size-0 [transform-style:preserve-3d]"
          style={{ transform: `translateZ(${initial.z}px)` }}
        >
          {reviews.map(([name, quote], i) => (
            <li
              key={name}
              className="absolute left-[calc(var(--cw)/-2)] top-[calc(var(--ch)/-2)] h-(--ch) w-(--cw) [backface-visibility:hidden]"
              style={{ transform: `rotateY(${i * step}deg) translateZ(calc(var(--r) * -1))` }}
            >
              <figure className="relative flex h-full flex-col border-[1.5px] border-gold bg-[#fdfbf6] p-[calc(var(--cw)*0.1)] text-ink shadow-[0_30px_60px_-34px_rgba(201,168,76,0.55)]">
                {/* Inner hairline: the double rule of an engraved card. */}
                <span aria-hidden="true" className="pointer-events-none absolute inset-[6px] border border-gold/40" />
                <span aria-hidden="true" className="display -mb-[0.32em] block text-[calc(var(--cw)*0.26)] leading-none text-gold">“</span>
                <blockquote className="display text-[calc(var(--cw)*0.076)] leading-[1.28] text-pretty">{quote}</blockquote>
                <figcaption className="mt-auto">
                  <span aria-label="Five stars" className="block text-[11px] tracking-[.25em] text-gold">★★★★★</span>
                  <span className="mt-3 block border-t border-gold/35 pt-3 text-[10px] font-bold uppercase tracking-[.24em] text-[#7d6320]">{name}</span>
                </figcaption>
                {/* Side-on cards fall into shadow; opacity is set every frame. */}
                <span aria-hidden="true" data-shade className="pointer-events-none absolute inset-0 bg-ink opacity-0" />
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
