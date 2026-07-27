import type { ReactNode } from 'react';

// Hand-written types for the registry-installed CountUp.jsx.
declare const CountUp: (props: {
  to: number;
  from?: number;
  direction?: 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  onStart?: () => void;
  onEnd?: () => void;
}) => ReactNode;

export default CountUp;
