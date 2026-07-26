import type { ReactNode } from 'react';

type FluidGlassProps = { children: ReactNode; className?: string };

export default function FluidGlass({ children, className = '' }: FluidGlassProps) {
  return <div className={`relative overflow-hidden border border-white/25 bg-white/[0.08] shadow-[0_10px_35px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-xl ${className}`}><svg className="absolute size-0" aria-hidden="true"><filter id="navbar-fluid-glass" x="-20%" y="-30%" width="140%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="8" result="noise" /><feGaussianBlur in="noise" stdDeviation="2" result="softNoise" /><feDisplacementMap in="SourceGraphic" in2="softNoise" scale="10" xChannelSelector="R" yChannelSelector="G" /></filter></svg><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(255,255,255,0.28),transparent_42%),linear-gradient(115deg,rgba(255,255,255,0.12),transparent_45%,rgba(201,168,76,0.16))]" style={{ filter: 'url(#navbar-fluid-glass)' }} /><div className="relative">{children}</div></div>;
}
