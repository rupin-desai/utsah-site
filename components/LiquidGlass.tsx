import type { CSSProperties, ReactNode } from 'react';

/**
 * Liquid glass surface. Refracts whatever the page paints behind it via
 * `backdrop-filter: url(...)` + an SVG edge displacement map, so it works over
 * video, imagery and flat colour alike.
 *
 * Knobs mirror the MeshTransmissionMaterial vocabulary:
 *  scale/ior            -> how far the edges bend the backdrop (px)
 *  thickness            -> how wide the bending edge band is
 *  roughness            -> frosting (blur)
 *  transmission         -> clarity; lower values tint the surface more
 *  chromaticAberration  -> per-channel bend offset (0 = no colour fringe)
 */
export type LiquidGlassProps = {
  children: ReactNode;
  className?: string;
  scale?: number;
  ior?: number;
  thickness?: number;
  roughness?: number;
  transmission?: number;
  chromaticAberration?: number;
  filterId?: string;
};

export default function LiquidGlass({
  children,
  className = '',
  scale = 0.15,
  ior = 2,
  thickness = 1,
  roughness = 0,
  transmission = 1,
  chromaticAberration = 0,
  filterId = 'liquid-glass',
}: LiquidGlassProps) {
  const bend = Math.round(scale * ior * 160); // 0.15 * 2 -> 48px of edge refraction
  const edgeX = 0.05 * thickness; // fraction of width that bends
  const edgeY = 0.35 * thickness; // fraction of height that bends
  const frost = roughness * 12;
  const tint = (1 - transmission) * 0.5;
  const fringe = chromaticAberration * bend;

  const map = displacementMap(edgeX, edgeY);
  const backdrop = [`url(#${filterId})`, frost > 0 && `blur(${frost}px)`, 'saturate(1.3)']
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={`relative isolate overflow-hidden border border-white/25 shadow-[0_10px_30px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.42),inset_0_-1px_0_rgba(255,255,255,0.12)] ${className}`}
    >
      <svg aria-hidden className="pointer-events-none absolute size-0">
        <filter id={filterId} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feImage href={map} width="100%" height="100%" preserveAspectRatio="none" result="map" />
          {fringe > 0 ? (
            <>
              <feDisplacementMap in="SourceGraphic" in2="map" scale={bend + fringe} xChannelSelector="R" yChannelSelector="G" result="red" />
              <feDisplacementMap in="SourceGraphic" in2="map" scale={bend - fringe} xChannelSelector="R" yChannelSelector="G" result="blue" />
              <feComponentTransfer in="red" result="redOnly">
                <feFuncG type="discrete" tableValues="0" />
                <feFuncB type="discrete" tableValues="0" />
              </feComponentTransfer>
              <feBlend in="redOnly" in2="blue" mode="screen" />
            </>
          ) : (
            <feDisplacementMap in="SourceGraphic" in2="map" scale={bend} xChannelSelector="R" yChannelSelector="G" />
          )}
        </filter>
      </svg>

      {/* Inset by the rim so displacement sampled from outside the surface stays hidden under the border. */}
      <div
        className="pointer-events-none absolute inset-0.75 rounded-[inherit]"
        style={{ backdropFilter: backdrop, WebkitBackdropFilter: backdrop } as CSSProperties}
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          background:
            `linear-gradient(180deg, rgba(255,255,255,0.10), rgba(11,11,11,0.18)), ` +
            `rgba(11,11,11,${(tint * 1.5).toFixed(3)})`,
        }}
      />
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(165deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.03)_24%,transparent_50%),radial-gradient(120%_200%_at_50%_-70%,rgba(255,255,255,0.14),transparent_60%)]" />
      <div className="relative">{children}</div>
    </div>
  );
}

/**
 * Mid-channel (128) = no shift, 0/255 = full shift. The horizontal ramp lives in
 * the red channel and the vertical one in green, so `feDisplacementMap` reads a
 * clean per-axis map instead of two greyscale ramps bleeding into each other.
 * `amp` shrinks the vertical throw — a short bar would otherwise fold onto itself.
 */
function displacementMap(edgeX: number, edgeY: number) {
  const gradient = (id: string, vertical: boolean, edge: number, amp: number) => {
    const lo = vertical ? `rgb(0,${Math.round(128 - amp * 127)},0)` : `rgb(${Math.round(128 - amp * 127)},0,0)`;
    const mid = vertical ? 'rgb(0,128,0)' : 'rgb(128,0,0)';
    const hi = vertical ? `rgb(0,${Math.round(128 + amp * 127)},0)` : `rgb(${Math.round(128 + amp * 127)},0,0)`;
    return (
      `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">` +
      `<stop offset="0" stop-color="${lo}"/>` +
      `<stop offset="${edge.toFixed(3)}" stop-color="${mid}"/>` +
      `<stop offset="${(1 - edge).toFixed(3)}" stop-color="${mid}"/>` +
      `<stop offset="1" stop-color="${hi}"/>` +
      `</linearGradient>`
    );
  };

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100" viewBox="0 0 400 100">` +
    `<defs>${gradient('x', false, edgeX, 1)}${gradient('y', true, edgeY, 0.35)}</defs>` +
    `<rect width="400" height="100" fill="url(#x)"/>` +
    `<rect width="400" height="100" fill="url(#y)" style="mix-blend-mode:screen"/>` +
    `</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
