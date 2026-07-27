'use client';

/**
 * Entry-animation primitives.
 *
 * One client module, so every page component stays server-rendered — a Server
 * Component may render these and pass strings through. The only rule for call
 * sites: never pass a function (no `onAnimationComplete`, no function variants).
 *
 * Design rules are baked in here so call sites cannot get them wrong:
 *   - entering only, ease-out only, one curve (the site's legacy expo-out)
 *   - transform + opacity only, never `transition: all`, never scale(0)
 *   - reveal once, never replay on re-scroll
 *
 * Raw `transform` strings instead of Motion's `y` prop: Motion hands an
 * animation to the compositor only for values literally named opacity, filter,
 * clipPath or transform. `y` is composed by Motion's own render loop, so it runs
 * on the main thread and stutters under hydration or image decode. The cost is
 * that both keyframes must share token count and per-slot units —
 * `translate3d(0, 24px, 0)` -> `translate3d(0px, 0px, 0px)` silently fails.
 *
 * Reduced motion changes only the TRANSITION, never a variant's style values.
 * Transitions never reach the SSR'd style attribute, so the server and the first
 * client render stay byte-identical and React has nothing to reconcile. (The
 * blanket CSS rule in globals.css cannot help here — Motion writes inline styles
 * per frame rather than driving a CSS transition.)
 *
 * Every animated element carries `data-reveal` so the no-JS rule in globals.css
 * can force it visible if the bundle never runs.
 */

import Link from 'next/link';
import {
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
  type Transition,
  type Variants,
} from 'motion/react';
import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ tokens */

/** Expo-out. The legacy static site's house curve — cohesive by default. */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
/** Slightly softer, for the longer travel of a word rising out of its mask. */
export const EASE_OUT_SOFT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Seconds. Legacy reveal was 750ms; stay in that register. */
export const DURATION = { rise: 0.7, word: 0.8 } as const;

/** Seconds between siblings. Emil's band is 30-80ms. */
export const STAGGER = { block: 0.08, word: 0.07 } as const;

/** Pixels of upward travel. Small enough never to read as a "slide in". */
export const DISTANCE = { rise: 28, small: 14 } as const;

/**
 * Fire when the element's top crosses ~85% of the viewport height. Deliberately
 * `amount: 'some'` rather than a fraction — a grid taller than the viewport can
 * never satisfy a fractional threshold and would stay hidden forever.
 */
const VIEWPORT = { once: true, amount: 'some', margin: '0px 0px -15% 0px' } as const;

/**
 * Must match `#intro` in app/globals.css: the curtain begins its 700ms sweep at
 * 2800ms, or at 600ms under the reduced-motion override. Exported so a drift
 * between the two is greppable.
 */
export const INTRO_UNCOVER_MS = 2800;
export const INTRO_UNCOVER_MS_REDUCED = 600;

/* -------------------------------------------------------------- transitions */

/** transform snaps; opacity keeps a short fade so nothing pops. */
const REDUCED: Transition = {
  opacity: { duration: 0.18, ease: 'linear' },
  transform: { duration: 0 },
};

const riseTransition = (reduce: boolean, duration: number, delay = 0): Transition =>
  reduce ? { ...REDUCED, delay } : { duration, ease: EASE_OUT, delay };

/* ----------------------------------------------------------------- variants */

const riseVariants = (distance: number): Variants => ({
  hidden: { opacity: 0, transform: `translate3d(0px, ${distance}px, 0px)` },
  visible: { opacity: 1, transform: 'translate3d(0px, 0px, 0px)' },
});

/**
 * Orchestration only — both variants are style-free, so the container renders no
 * inline styles and cannot disturb a grid or flex layout.
 */
const orchestration = (reduce: boolean, stagger: number, delay: number): Variants => ({
  hidden: {},
  visible: {
    transition: reduce
      ? { staggerChildren: 0, delayChildren: 0 }
      : { staggerChildren: stagger, delayChildren: delay },
  },
});

/* ------------------------------------------------------------------ provider */

/**
 * `features` is a function and cannot cross the server -> client boundary, so
 * layout.tsx renders this wrapper rather than <LazyMotion> directly. Lets every
 * primitive below use `m.*` instead of `motion.*`, roughly halving the shipped
 * bundle; `strict` throws if anyone reaches for `motion.*` and quietly undoes it.
 *
 * The feature import is static on purpose. An async loader would leave every
 * reveal stuck at opacity 0 until its chunk landed.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  // Handshake with the boot script in app/layout.tsx: proof the bundle ran. If
  // this never fires, that script flips data-motion to "off" at 5s and
  // globals.css forces every [data-reveal] visible.
  useEffect(() => {
    document.documentElement.dataset.motion = 'on';
  }, []);

  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}

/* ------------------------------------------------------------------ intro gate */

/**
 * The intro overlay covers the viewport on every hard load of every route, so
 * anything above the fold — including PageHero, not just the homepage — would
 * otherwise play and finish unseen.
 *
 * "The hero may start" means whichever comes first of:
 *   (a) the user skipped the intro  -> data-intro is no longer "run"
 *   (b) the curtain begins to lift  -> INTRO_UNCOVER_MS since navigation start
 *
 * Timed from `performance.now()`, not from mount: hydration can land several
 * hundred ms after first paint and the curtain does not wait for it. Firing a
 * few ms early is the intent — the words rise *into* the lifting curtain.
 * Soft navigations never re-run the intro, so this resolves on the first effect.
 */
export function useIntroReady(enabled = true): boolean {
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const root = document.documentElement;
    if (root.dataset.intro !== 'run') {
      setReady(true);
      return;
    }

    const target = reduce ? INTRO_UNCOVER_MS_REDUCED : INTRO_UNCOVER_MS;
    const timer = window.setTimeout(
      () => setReady(true),
      Math.max(0, target - performance.now()),
    );
    const observer = new MutationObserver(() => {
      if (root.dataset.intro === 'done') setReady(true);
    });
    observer.observe(root, { attributes: true, attributeFilter: ['data-intro'] });

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [enabled, reduce]);

  return enabled ? ready : true;
}

/* ------------------------------------------------------------------ tags */

type Tag =
  | 'div'
  | 'section'
  | 'article'
  | 'aside'
  | 'header'
  | 'footer'
  | 'nav'
  | 'figure'
  | 'figcaption'
  | 'ul'
  | 'ol'
  | 'li'
  | 'p'
  | 'span'
  | 'blockquote';

/** The `m` proxy caches generated components, so this is cheap per render. */
function motionTag(tag: Tag) {
  return m[tag] as typeof m.div;
}

type TriggerProps = {
  once?: boolean;
  amount?: 'some' | 'all' | number;
  margin?: string;
  /** Hold until the intro curtain lifts. For above-the-fold content only. */
  afterIntro?: boolean;
};

/* ------------------------------------------------------------------- Reveal */

export type RevealProps = TriggerProps & {
  as?: Tag;
  className?: string;
  children?: ReactNode;
  id?: string;
  /** Seconds. */
  delay?: number;
  /** Pixels of upward travel. */
  distance?: number;
  duration?: number;
};

/** Fades and rises a single element as it enters the viewport. Reveals once. */
export function Reveal({
  as = 'div',
  className,
  children,
  id,
  delay = 0,
  distance = DISTANCE.rise,
  duration = DURATION.rise,
  once = VIEWPORT.once,
  amount = VIEWPORT.amount,
  margin = VIEWPORT.margin,
  afterIntro = false,
}: RevealProps) {
  const reduce = !!useReducedMotion();
  const introReady = useIntroReady(afterIntro);
  const El = motionTag(as);
  const variants = useMemo(() => riseVariants(distance), [distance]);

  return (
    <El
      id={id}
      data-reveal
      className={className}
      variants={variants}
      initial="hidden"
      // afterIntro elements are above the fold by definition, so viewport
      // detection is meaningless for them — drive them off the gate instead.
      animate={afterIntro ? (introReady ? 'visible' : 'hidden') : undefined}
      whileInView={afterIntro ? undefined : 'visible'}
      viewport={afterIntro ? undefined : { once, amount, margin }}
      transition={riseTransition(reduce, duration, delay)}
    >
      {children}
    </El>
  );
}

/* -------------------------------------------------- RevealGroup / RevealItem */

export type RevealGroupProps = TriggerProps & {
  as?: Tag;
  className?: string;
  children?: ReactNode;
  id?: string;
  /** Seconds before the first child. */
  delay?: number;
  /** Seconds between siblings. */
  stagger?: number;
};

/**
 * Stagger container. This *is* the grid/flex element — pass the wrapper's own
 * className so layout is unchanged. Children pick the variant name up through
 * React context, so `.map()`ed <RevealItem>s need no index maths.
 */
export function RevealGroup({
  as = 'div',
  className,
  children,
  id,
  delay = 0,
  stagger = STAGGER.block,
  once = VIEWPORT.once,
  amount = VIEWPORT.amount,
  margin = VIEWPORT.margin,
  afterIntro = false,
}: RevealGroupProps) {
  const reduce = !!useReducedMotion();
  const introReady = useIntroReady(afterIntro);
  const El = motionTag(as);
  const variants = useMemo(
    () => orchestration(reduce, stagger, delay),
    [reduce, stagger, delay],
  );

  return (
    <El
      id={id}
      className={className}
      variants={variants}
      initial="hidden"
      animate={afterIntro ? (introReady ? 'visible' : 'hidden') : undefined}
      whileInView={afterIntro ? undefined : 'visible'}
      viewport={afterIntro ? undefined : { once, amount, margin }}
    >
      {children}
    </El>
  );
}

/**
 * Opting an item out of its group and onto its own viewport trigger. For lists
 * whose items are tall enough that the group's trigger would fire while later
 * items are still well below the fold — the stagger is worth nothing there, and
 * those items would be mid-animation by the time you scrolled to them.
 */
type SoloProps = { solo?: boolean };

function soloTrigger(solo: boolean) {
  return solo
    ? ({ initial: 'hidden', whileInView: 'visible', viewport: VIEWPORT } as const)
    : {};
}

export type RevealItemProps = SoloProps & {
  as?: Tag;
  className?: string;
  children?: ReactNode;
  distance?: number;
  duration?: number;
  id?: string;
  'aria-label'?: string;
};

/**
 * Child of <RevealGroup>. Unless `solo`, it deliberately has NO
 * initial/animate/whileInView: setting any of them severs variant inheritance
 * and the child animates on its own, ignoring the stagger. Never give it a
 * `delay` either — the parent's staggerChildren is delivered as `delay` and an
 * explicit one overwrites it.
 *
 * Rendered outside a group without `solo` it simply stays visible rather than
 * disappearing.
 */
export function RevealItem({
  as = 'div',
  className,
  children,
  distance = DISTANCE.rise,
  duration = DURATION.rise,
  solo = false,
  id,
  'aria-label': ariaLabel,
}: RevealItemProps) {
  const reduce = !!useReducedMotion();
  const El = motionTag(as);
  const variants = useMemo(() => riseVariants(distance), [distance]);

  return (
    <El
      id={id}
      aria-label={ariaLabel}
      data-reveal
      className={className}
      variants={variants}
      transition={riseTransition(reduce, duration)}
      {...soloTrigger(solo)}
    >
      {children}
    </El>
  );
}

/** Must be module scope — calling m.create() in render remounts the subtree. */
const MotionLink = m.create(Link);

/**
 * React's DOM `onAnimationStart`/`onDrag*` handlers collide with Motion's
 * same-named props, so they are dropped rather than resolved — nothing here
 * needs them, and a Server Component could not pass a function anyway.
 */
export type RevealLinkProps = Omit<
  ComponentProps<typeof Link>,
  'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'style'
> &
  SoloProps & {
    distance?: number;
    duration?: number;
  };

/**
 * A <RevealItem> that IS the link, for grids whose direct children are next/link.
 * Avoids inserting a wrapper div and then having to chase `h-full` and
 * `min-h-*` back down onto the anchor.
 */
export function RevealLink({
  className,
  children,
  distance = DISTANCE.rise,
  duration = DURATION.rise,
  solo = false,
  ...rest
}: RevealLinkProps) {
  const reduce = !!useReducedMotion();
  const variants = useMemo(() => riseVariants(distance), [distance]);

  return (
    <MotionLink
      {...rest}
      data-reveal
      className={className}
      variants={variants}
      transition={riseTransition(reduce, duration)}
      {...soloTrigger(solo)}
    >
      {children}
    </MotionLink>
  );
}

/* --------------------------------------------------------------- SplitText */

/**
 * The clip box.
 *  - inline-block + overflow-clip is the mask. `overflow-clip`, NOT
 *    `overflow-hidden`: an inline-block whose overflow makes it a scroll
 *    container takes its baseline from the bottom margin edge instead of from
 *    its text, which silently lifts every word off the heading's baseline by
 *    roughly the font's descent — 13px at text-7xl. `clip` is not a scroll
 *    container, so the baseline is left alone while the clipping is identical.
 *  - pb/-mb extends the clip region past the baseline so descenders (g, y, p)
 *    survive `leading-[.95]`, then removes the layout cost again.
 *  - pt/-mt does the same for tall caps. It cannot leak, since words travel up
 *    from below.
 */
const MASK = 'inline-block overflow-clip pt-[0.12em] -mt-[0.12em] pb-[0.2em] -mb-[0.2em]';

/**
 * 130%, not 100%. The mask is padded past the baseline for descenders, and that
 * same padding would let the top of the word peek through at exactly 100%. The
 * invariant is `translate% >= 100% + pb / line-height`; the tightest case on the
 * site is PageHero at `leading-[.95]`, which needs ~121%.
 */
const WORD_VARIANTS: Variants = {
  hidden: { opacity: 0, transform: 'translate3d(0px, 130%, 0px)' },
  visible: { opacity: 1, transform: 'translate3d(0px, 0%, 0px)' },
};

export type SplitTextProps = TriggerProps & {
  /**
   * One entry per HARD line. A plain string is a single line that wraps and
   * balances naturally. Use the array form where the design has a <br /> —
   * HomePage's h1 becomes ['Let's create magical', 'memories together'] rather
   * than trying to split JSX.
   */
  text: string | string[];
  /**
   * The gold period. Rendered INSIDE the final word's animated span so it can
   * never orphan onto a line of its own, and never lags the word it belongs to.
   */
  accent?: ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
};

export const GOLD_PERIOD = <span className="text-gold">.</span>;

/**
 * Word-by-word heading reveal: each word rises out of an overflow-hidden mask.
 * Renders an inline-level subtree, so it goes *inside* the existing <h1>/<h2>
 * and inherits its type styles untouched.
 *
 * Accessibility: the split copy is aria-hidden and a visually-hidden copy of the
 * real string sits alongside it, so the heading reads as one phrase.
 *
 * Multi-line input keeps a continuous word index across lines, so the stagger
 * flows through the line break instead of restarting.
 */
export function SplitText({
  text,
  accent = GOLD_PERIOD,
  className,
  delay = 0,
  stagger = STAGGER.word,
  duration = DURATION.word,
  once = VIEWPORT.once,
  amount = VIEWPORT.amount,
  margin = VIEWPORT.margin,
  afterIntro = false,
}: SplitTextProps) {
  const reduce = !!useReducedMotion();
  const introReady = useIntroReady(afterIntro);

  const lines = useMemo(
    () => (Array.isArray(text) ? text : [text]).map((l) => l.split(/\s+/).filter(Boolean)),
    [text],
  );
  const plain = useMemo(() => (Array.isArray(text) ? text.join(' ') : text), [text]);
  const container = useMemo(
    () => orchestration(reduce, stagger, delay),
    [reduce, stagger, delay],
  );
  const wordTransition: Transition = reduce
    ? REDUCED
    : { transform: { duration, ease: EASE_OUT_SOFT }, opacity: { duration: 0.3 } };
  const lastLine = lines.length - 1;

  return (
    <>
      <span className="sr-only">
        {plain}
        {accent}
      </span>
      <m.span
        aria-hidden="true"
        // block, so each line span is a proper block container and inherits
        // text-wrap: balance and text-align from the heading.
        className={cn('block', className)}
        variants={container}
        initial="hidden"
        animate={afterIntro ? (introReady ? 'visible' : 'hidden') : undefined}
        whileInView={afterIntro ? undefined : 'visible'}
        viewport={afterIntro ? undefined : { once, amount, margin }}
      >
        {lines.map((words, li) => (
          <span key={li} className="block">
            {words.map((word, wi) => (
              <Fragment key={`${li}-${wi}`}>
                <span className={MASK}>
                  <m.span
                    data-reveal
                    className="inline-block"
                    variants={WORD_VARIANTS}
                    transition={wordTransition}
                  >
                    {word}
                    {li === lastLine && wi === words.length - 1 ? accent : null}
                  </m.span>
                </span>
                {/* A real space text node, not a margin: preserves wrapping,
                    text-balance break opportunities, and copy/paste. */}
                {wi < words.length - 1 ? ' ' : null}
              </Fragment>
            ))}
          </span>
        ))}
      </m.span>
    </>
  );
}
