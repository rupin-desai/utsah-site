'use client';

/**
 * The opener. A pinned DepthStage in parallax mode: the bride stands in front
 * of a band of the event types, which runs in front of the lit garden behind
 * her. Scrolling slides the layers past each other at their own depths — the
 * garden barely moves, the band drifts, she rises fastest, the caption faster
 * still. The last screen of the track is the manifesto sliding up over the
 * still-pinned stage (Manifesto's `overlap`), so the hero is covered, not
 * faded out.
 *
 * The plates are two generated images (an empty venue and the bride on
 * transparency), so the back plate is clean and parallax cannot show a double.
 *
 * Must stay the first <section> in <main>: SiteHeader reads `main > section`
 * to decide when the bar has left the hero.
 */

import Link from 'next/link';
import { useScroll } from 'motion/react';
import { useRef } from 'react';
import DepthStage from '@/components/motion/DepthStage';
import { DISTANCE, Reveal, SplitText, useIntroReady } from '@/components/motion/reveal';
import { Marquee, PinTrack, useStaticMotion } from '@/components/motion/scroll';

export type DepthHeroProps = {
  /** Phrases for the band that runs behind the subject. */
  band: string[];
};

export default function DepthHero({ band }: DepthHeroProps) {
  const track = useRef<HTMLElement>(null);
  const isStatic = useStaticMotion();
  const introReady = useIntroReady();
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] });

  return (
    // 250svh: 150svh of pinned scroll, the last 100 of them under the incoming
    // manifesto — keep in step with SLIDE_OVER in Manifesto.tsx.
    <PinTrack trackRef={track} isStatic={isStatic} tone="ink" className="relative h-[250svh]">
      <div className="sticky top-0 h-svh overflow-hidden text-white">
        <DepthStage
          bg="/assets/hero/layers/night-bg.jpg"
          fg="/assets/hero/layers/night-bride.png"
          alt="A laughing bride in a crimson lehenga at a lantern-lit garden wedding"
          mode="parallax"
          objectPosition="50% 40%"
          // Hand-cropped PNG, used as supplied (893x963, tight to her). Her
          // head-and-torso centroid sits at 46.4% across, left of the image
          // centre because her veil trails right. Height puts her crown about
          // a fifth down the screen with the frame's bottom off-screen through
          // her climb.
          subject={{ width: 893, height: 963, centerX: 0.464, raw: true, className: 'h-[90svh] sm:h-[97svh]' }}
          priority
          progress={scrollYProgress}
          entranceReady={introReady}
          exit
          // Across her head: her crown sits ~40% down the screen at rest, so
          // her face and veil pass in front of the band.
          middleClassName="top-[36%] sm:top-[34%]"
          middle={
            <Reveal delay={0.9} distance={DISTANCE.small} afterIntro>
              <Marquee items={band} className="display text-[clamp(2.75rem,8.5vw,8rem)] leading-[0.92] italic text-white/90 [text-shadow:0_1px_24px_rgba(0,0,0,.35)]" />
            </Reveal>
          }
          front={
            // Everything here is afterIntro — it sits under the intro curtain
            // until ~2800ms, so a viewport trigger would play it unseen.
            // A caption, not a headline: the band and the bride carry the
            // screen, so the copy stays small and tucked into the corner,
            // clear of her. No page-shell: it hugs the screen corner, not the
            // centred content column.
            <div className="flex h-full flex-col items-start justify-end px-5 pb-8 sm:px-8 sm:pb-12 lg:px-12 [text-shadow:0_1px_24px_rgba(0,0,0,.35)]">
              <div className="max-w-sm">
                <h1 className="display text-[clamp(1.6rem,2.6vw,2.5rem)] leading-[1.08]">
                  <SplitText text={["Let's create magical", 'memories together']} delay={0.12} afterIntro />
                </h1>
                <Reveal as="p" className="mt-4 text-[11px] uppercase tracking-[.2em] text-white/80" delay={0.55} afterIntro>Premium event planning · Bardoli, Gujarat</Reveal>
                <Reveal className="mt-5" delay={0.7} distance={DISTANCE.small} afterIntro><Link href="#about" className="inline-flex border-b border-gold pb-1.5 text-xs font-semibold uppercase tracking-[.18em] text-gold-light">Discover Utsah</Link></Reveal>
              </div>
            </div>
          }
        />
      </div>
    </PinTrack>
  );
}
