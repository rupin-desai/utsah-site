'use client';

/**
 * The page as one surface. Renders <main> and keeps `data-canvas` set to the
 * tone of whichever [data-tone] section is crossing the middle of the screen;
 * globals.css eases the ground and every tone-aware colour to match.
 *
 * `data-canvas` only appears after mount. Until then (and without JS) each
 * section paints its own tone, so the page is always legible.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';

type Tone = 'ink' | 'paper';

export default function ToneCanvas({ children }: { children: ReactNode }) {
  const main = useRef<HTMLElement>(null);
  const [tone, setTone] = useState<Tone | null>(null);

  useEffect(() => {
    const root = main.current;
    if (!root) return;
    const sections = [...root.querySelectorAll<HTMLElement>(':scope > [data-tone]')];
    if (!sections.length) return;

    // The canvas belongs to the last section whose top has passed the middle
    // of the viewport. Derived from position, never from crossing events: a
    // jump (reload, anchor, End key) skips the crossings, and the footer —
    // which declares no tone — must keep the close's tone, not a stale one.
    const pick = () => {
      const mid = window.innerHeight / 2;
      let current = sections[0];
      for (const s of sections) if (s.getBoundingClientRect().top <= mid) current = s;
      setTone(current.dataset.tone as Tone);
    };
    pick();

    // A zero-height band across the middle fires whenever a section's edge
    // crosses it — the only moments the answer can change in normal scrolling.
    const observer = new IntersectionObserver(pick, { rootMargin: '-50% 0px -50% 0px' });
    sections.forEach((s) => observer.observe(s));
    // Jumps can land with no crossing at all; scrollend settles those.
    window.addEventListener('scrollend', pick);
    window.addEventListener('resize', pick);
    return () => {
      observer.disconnect();
      window.removeEventListener('scrollend', pick);
      window.removeEventListener('resize', pick);
    };
  }, []);

  return (
    <main ref={main} data-canvas={tone ?? undefined}>
      {/* One grain over everything, photography and flat fields alike. */}
      <div aria-hidden="true" className="grain" />
      {children}
    </main>
  );
}
