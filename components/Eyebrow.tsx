import type { ReactNode } from 'react';

/** Classes for any element that carries an eyebrow. */
export const EYEBROW = 'eyebrow flex items-center gap-3';

/**
 * Chapter mark: `03 —— What we create`. Every home section opens on one, so
 * the page reads as numbered chapters of a single story. Renders inline
 * content only — put it inside a `p` (or a Reveal `as="p"`) with EYEBROW.
 */
export function EyebrowLabel({ index, children }: { index?: string; children: ReactNode }) {
  return (
    <>
      {index ? (
        <>
          <span className="tabular-nums">{index}</span>
          <span aria-hidden="true" className="h-px w-8 bg-gold/50" />
        </>
      ) : null}
      <span>{children}</span>
    </>
  );
}
