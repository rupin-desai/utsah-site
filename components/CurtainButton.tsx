'use client';

/**
 * The site's one button. On hover a fill sweeps in from the left like a
 * curtain; on leaving it carries on and sweeps out to the right, rather than
 * retreating the way it came.
 *
 * Why it needs state: the fill rests clipped away at the LEFT (ready to enter),
 * but leaves by being clipped away at the RIGHT. CSS alone can only animate
 * back to the rest state, which would undo the sweep. So it runs rest -> in ->
 * out, and after the exit finishes it snaps back to rest without a transition
 * (globals.css, `.curtain`).
 *
 * The label is rendered twice in the same grid cell: once plain, once on the
 * fill. The fill's copy is clipped with it, so the text changes colour exactly
 * at the curtain's edge. The copy is aria-hidden; the button reads once.
 */

import Link from 'next/link';
import { useState, type ComponentProps, type ReactNode, type TransitionEvent } from 'react';
import { cn } from '@/lib/utils';

type State = 'rest' | 'in' | 'out';

type Common = {
  /** outline: hairline border, the fill is gold. solid: gold, the fill is ink with gold type. */
  variant?: 'outline' | 'solid';
  /** Small spaced capitals instead of sentence case. */
  caps?: boolean;
  className?: string;
  children: ReactNode;
};
type AsLink = Common & { href: string } & Omit<ComponentProps<'a'>, 'href' | 'className' | 'children'>;
type AsButton = Common & { href?: undefined } & Omit<ComponentProps<'button'>, 'className' | 'children'>;
export type CurtainButtonProps = AsLink | AsButton;

const LAYER = '[grid-area:1/1] flex items-center justify-center px-6 py-3.5';
const SKIN = {
  outline: { base: 'border border-tone/25 data-[curtain=in]:border-gold', fill: 'bg-gold text-ink' },
  solid: { base: 'border border-gold bg-gold text-ink', fill: 'bg-ink text-gold-light' },
};

export default function CurtainButton(props: CurtainButtonProps) {
  const { variant = 'outline', caps = false, className, children, ...rest } = props;
  const [state, setState] = useState<State>('rest');

  const handlers = {
    onPointerEnter: () => setState('in'),
    onPointerLeave: () => setState((s) => (s === 'in' ? 'out' : s)),
    onFocus: () => setState('in'),
    onBlur: () => setState((s) => (s === 'in' ? 'out' : s)),
    // The exit has finished: back to rest, clipped at the left, unanimated.
    onTransitionEnd: (e: TransitionEvent) => {
      if (state === 'out' && (e.target as HTMLElement).dataset.curtainFill !== undefined) setState('rest');
    },
  };
  const skin = SKIN[variant];
  const classes = cn(
    'curtain group relative isolate inline-grid overflow-hidden text-sm transition-colors duration-500 [text-shadow:none]',
    caps ? 'text-xs font-bold uppercase tracking-[.18em] sm:text-sm' : 'font-semibold',
    skin.base,
    className,
  );
  const inner = (
    <>
      <span className={LAYER}>{children}</span>
      <span aria-hidden="true" data-curtain-fill="" className={cn(LAYER, 'curtain-fill', skin.fill)}>
        {children}
      </span>
    </>
  );

  if ('href' in rest && rest.href !== undefined) {
    const { href, ...anchor } = rest as Omit<AsLink, keyof Common>;
    const external = /^(https?:|mailto:|tel:)/.test(href);
    const shared = { ...anchor, ...handlers, 'data-curtain': state, className: classes };
    return external ? (
      <a href={href} target="_blank" rel="noopener noreferrer" {...shared}>
        {inner}
      </a>
    ) : (
      <Link href={href} {...shared}>
        {inner}
      </Link>
    );
  }
  const { type = 'button', ...button } = rest as Omit<AsButton, keyof Common>;
  return (
    <button type={type} {...button} {...handlers} data-curtain={state} className={classes}>
      {inner}
    </button>
  );
}
