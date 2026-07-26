import type { CSSProperties, ReactNode } from 'react';

export type FluidGlassSettings = {
  mode: 'bar';
  scale: number;
  ior: number;
  thickness: number;
  chromaticAberration: number;
  anisotropy: number;
  transmission: number;
  roughness: number;
};

type FluidGlassProps = {
  children: ReactNode;
  className?: string;
  settings: FluidGlassSettings;
};

export default function FluidGlass({ children, className = '', settings }: FluidGlassProps) {
  const displacement = settings.scale * settings.ior * 40;
  const noiseX = 0.012 + settings.anisotropy * 0.004;
  const noiseY = 0.012 - settings.anisotropy * 0.004;
  const frost = 18 + settings.roughness * 12;
  const surfaceOpacity = 0.04 + settings.transmission * 0.04;
  const style = {
    border: `${settings.thickness}px solid rgba(255,255,255,0.25)`,
    '--glass-frost': `${frost}px`,
    '--glass-opacity': surfaceOpacity,
  } as CSSProperties;

  return (
    <div
      className={`relative overflow-hidden bg-white/[var(--glass-opacity)] shadow-[0_10px_35px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.34)] backdrop-blur-[var(--glass-frost)] ${className}`}
      style={style}
      data-mode={settings.mode}
      data-chromatic-aberration={settings.chromaticAberration}
    >
      <svg className="absolute size-0" aria-hidden="true">
        <filter id="navbar-fluid-glass" x="-20%" y="-30%" width="140%" height="160%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={`${noiseX} ${noiseY}`}
            numOctaves="2"
            seed="8"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation={0.25 + settings.roughness * 3} result="softNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softNoise"
            scale={displacement}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(255,255,255,0.3),transparent_42%),linear-gradient(115deg,rgba(255,255,255,0.12),transparent_45%,rgba(201,168,76,0.14))]"
        style={{ filter: 'url(#navbar-fluid-glass)' }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
