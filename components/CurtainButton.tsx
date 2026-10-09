/**
 * The site's one button. On hover a fill sweeps in from the left like a
 * curtain; on leaving it carries on and sweeps out to the right.
 *
 * Pure CSS (globals.css, `.curtain`), no state and no JS: the fill is a
 * ::before scaled on the x axis only, so it is a compositor-only transform.
 * Its transform-origin is the trick — at rest it sits at the right edge, on
 * hover at the left — so scaling up grows from the left and scaling back down
 * shrinks toward the right, and the fill always travels left to right.
 */

import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

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

const SKIN = {
  outline: 'curtain-outline border border-tone/25',
  solid: 'curtain-solid border border-gold bg-gold text-ink',
};

export default function CurtainButton(props: CurtainButtonProps) {
  const { variant = 'outline', caps = false, className, children, ...rest } = props;
  const classes = cn(
    'curtain inline-flex items-center justify-center px-6 py-3.5 text-sm [text-shadow:none]',
    caps ? 'text-xs font-bold uppercase tracking-[.18em] sm:text-sm' : 'font-semibold',
    SKIN[variant],
    className,
  );

  if ('href' in rest && rest.href !== undefined) {
    const { href, ...anchor } = rest as Omit<AsLink, keyof Common>;
    if (/^(https?:|mailto:|tel:)/.test(href)) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...anchor} className={classes}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} {...anchor} className={classes}>
        {children}
      </Link>
    );
  }
  const { type = 'button', ...button } = rest as Omit<AsButton, keyof Common>;
  return (
    <button type={type} {...button} className={classes}>
      {children}
    </button>
  );
}
