import { STROKES } from './strokes';
import { WORDMARK_D } from './wordmark-d';

// Server component on purpose: the ~20KB path and the stroke table are rendered
// into HTML and never enter the client bundle. The whole animation is CSS
// (see globals.css); the only JS is the tiny inline script in app/layout.tsx.
export default function IntroOverlay() {
  return (
    <div id="intro" aria-hidden="true">
      <svg viewBox="0 0 2316 1020" className="w-[min(78vw,720px)]" role="presentation">
        <defs>
          <mask id="intro-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="2316" height="1020">
            {STROKES.map((s, i) => (
              <path
                key={i}
                d={s.d}
                fill="none"
                stroke="#fff"
                strokeWidth={s.w}
                strokeLinecap="round"
                strokeLinejoin="round"
                // dasharray/offset seed the animation; the keyframe only sets `to: 0`,
                // so the implicit `from` is whatever we set here.
                style={{
                  strokeDasharray: s.len,
                  strokeDashoffset: s.len,
                  animationDelay: `${s.delay}ms`,
                  animationDuration: `${s.dur}ms`,
                }}
              />
            ))}
          </mask>
        </defs>
        <path d={WORDMARK_D} fillRule="evenodd" fill="#FF2116" mask="url(#intro-mask)" />
      </svg>
    </div>
  );
}
