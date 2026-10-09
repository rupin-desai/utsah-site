'use client';

/**
 * Site-wide inertial scrolling (Lenis). It still drives the native window
 * scroll, so `position: sticky`, Motion's useScroll and every pinned track
 * keep working unchanged — they simply receive a smoother scroll position.
 *
 *   - off under prefers-reduced-motion: native scrolling, untouched
 *   - in-page anchors (`#about`) glide instead of jumping
 *   - pauses whenever something locks the page by setting
 *     `overflow: hidden` on <body> (StaggeredMenu's open panel), so the page
 *     cannot drift behind an overlay
 *
 * Renders nothing; layout.tsx mounts it once for every route.
 */

import Lenis from 'lenis';
import { useEffect } from 'react';

/**
 * Per-frame catch-up toward the target scroll position. Lower is silkier but
 * laggier; 0.09 keeps the glide without the page feeling detached from the
 * wheel — the Premium register, no overshoot.
 */
const LERP = 0.09;

export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({ autoRaf: true, lerp: LERP, anchors: true });

    const sync = () => {
      if (document.body.style.overflow === 'hidden') lenis.stop();
      else lenis.start();
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });

    return () => {
      observer.disconnect();
      lenis.destroy();
    };
  }, []);

  return null;
}
