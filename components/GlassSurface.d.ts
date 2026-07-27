import type { CSSProperties, ReactNode } from 'react';

// Hand-written types for the registry-installed GlassSurface.jsx.
declare const GlassSurface: (props: {
  children?: ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  borderWidth?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;
  displace?: number;
  backgroundOpacity?: number;
  saturation?: number;
  distortionScale?: number;
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
  xChannel?: 'R' | 'G' | 'B';
  yChannel?: 'R' | 'G' | 'B';
  mixBlendMode?: string;
  className?: string;
  style?: CSSProperties;
}) => ReactNode;

export default GlassSurface;
