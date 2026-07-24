'use client';

import { useEffect, useRef } from 'react';

/**
 * Re-runs the original page's <script> tags, in source order, once the markup
 * is in the DOM. Scripts injected via innerHTML never execute, so they are
 * lifted out at conversion time and replayed here instead.
 */
export default function LegacyScripts({ scripts }) {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    let cancelled = false;

    (async () => {
      for (const item of scripts) {
        if (cancelled) return;
        const el = document.createElement('script');
        if (item.src) {
          el.src = item.src;
          el.async = false;
          const loaded = new Promise((resolve) => {
            el.onload = resolve;
            el.onerror = resolve;
          });
          document.body.appendChild(el);
          await loaded;
        } else {
          el.textContent = item.code;
          document.body.appendChild(el);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [scripts]);

  return null;
}
