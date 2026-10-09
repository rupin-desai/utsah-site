import type { CSSProperties } from 'react';
import { SEGMENTS } from './strokes';
import {
  CURTAIN_AT,
  CURTAIN_MS,
  EXIT_AT,
  INTRO_TOTAL,
  LAYER_STAGGER,
  LIFT_MS,
  SETTLE_AT,
  SETTLE_MS,
} from './timeline';
import { WORDMARK_D } from './wordmark-d';

// The timeline lives in timeline.ts (generated with the strokes it has to
// follow) and reaches globals.css as custom properties, so nothing is
// hand-synced.
const TIMELINE = {
  '--intro-settle': `${SETTLE_AT}ms`,
  '--intro-settle-ms': `${SETTLE_MS}ms`,
  '--intro-exit': `${EXIT_AT}ms`,
  '--intro-lift-ms': `${LIFT_MS}ms`,
  '--intro-curtain': `${CURTAIN_AT}ms`,
  '--intro-curtain-ms': `${CURTAIN_MS}ms`,
  '--intro-stagger': `${LAYER_STAGGER}ms`,
  '--intro-total': `${INTRO_TOTAL}ms`,
} as CSSProperties;

// Server component on purpose: the paths and the segment table are rendered
// into HTML and never enter the client bundle. The whole animation is CSS
// (see globals.css); the only JS is the tiny inline script in app/layout.tsx.
export default function IntroOverlay() {
  return (
    <div id="intro" aria-hidden="true" style={TIMELINE}>
      {/* The mobile menu's pre-layers (SiteHeader's StaggeredMenu colours), in
          reverse: the white panel leaves first and these trail it out. */}
      <div className="intro-layer intro-red bg-[#8a1421]" />
      <div className="intro-layer intro-gold bg-gold" />
      <div className="intro-layer intro-panel">
        <div className="intro-mark">
          <svg viewBox="0 0 2316 1020" className="block w-[min(78vw,720px)]" role="presentation">
            <defs>
              <path id="intro-word" d={WORDMARK_D} fillRule="evenodd" />
              {SEGMENTS.map((s, i) => (
                <clipPath key={i} id={`intro-c${i}`}>
                  <path d={s.clip} />
                </clipPath>
              ))}
              <mask id="intro-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="2316" height="1020">
                {SEGMENTS.map((s, i) => (
                  <path
                    key={i}
                    d={s.d}
                    clipPath={`url(#intro-c${i})`}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={s.w}
                    strokeLinejoin="round"
                    // Butt caps (the default): a round cap pops in as a half-disc
                    // the instant the dash enters the path. The dash/offset pair
                    // seeds the animation; the keyframe only sets `to: 0`. The
                    // gap is longer than the path so the next dash never shows.
                    style={{
                      strokeDasharray: `${s.len} ${s.len + 10}`,
                      strokeDashoffset: s.len,
                      animationDelay: `${s.delay}ms`,
                      animationDuration: `${s.dur}ms`,
                      animationTimingFunction: s.ease,
                    }}
                  />
                ))}
              </mask>
            </defs>
            {/* The writing, then the same mark unmasked: it fades in once the pen is
                done and hides the hairline seams between territories. */}
            <use href="#intro-word" fill="#FF2116" mask="url(#intro-mask)" />
            <use href="#intro-word" fill="#FF2116" className="intro-ink" />
          </svg>
        </div>
      </div>
    </div>
  );
}
