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
          // her climb. The translate nudges her right of centre to balance
          // the caption in the bottom-left corner; it is the `translate`
          // property, so it stacks on DepthStage's centring transform.
          subject={{ width: 893, height: 963, centerX: 0.464, raw: true, className: 'h-[90svh] translate-x-[2.5vw] sm:h-[97svh]' }}
          priority
          progress={scrollYProgress}
          entranceReady={introReady}
          exit
          // Across her head: her crown sits ~40% down the screen at rest, so
          // her face and veil pass in front of the band.
          middleClassName="top-[36%] sm:top-[34%]"
          middle={
            // Word by word, rising, once the curtain's last (red) layer has
            // cleared the band and the screen has settled — 1.1s after it
            // starts to lift.
            <Marquee
              items={band}
              entrance={{ show: introReady, delay: 1.1, stagger: 0.06 }}
              className="font-sans text-[clamp(2.75rem,8.5vw,8rem)] font-light leading-[0.95] tracking-[-0.03em] text-white/90 [text-shadow:0_1px_24px_rgba(0,0,0,.35)]"
            />
          }
          front={
            // Everything here is afterIntro — it sits under the intro curtain
            // until ~2.9s (CURTAIN_AT), so a viewport trigger would play it unseen.
            // A caption, not a headline: the band and the bride carry the
            // screen, so the copy stays small and tucked into the corner,
            // clear of her. No page-shell: it hugs the screen corner, not the
            // centred content column.
            <div className="flex h-full flex-col items-start justify-end px-5 pb-5 sm:px-8 sm:pb-7 lg:px-12 [text-shadow:0_1px_24px_rgba(0,0,0,.35)]">
              <div className="max-w-xs">
                <h1 className="display text-[clamp(1.3rem,1.9vw,1.85rem)] leading-[1.08]">
                  <SplitText text={["Let's create magical", 'memories together']} delay={0.12} afterIntro />
                </h1>
                <Reveal className="mt-3.5" delay={0.55} distance={DISTANCE.small} afterIntro><Link href="#about" className="inline-flex border-b border-gold pb-1.5 text-xs font-semibold uppercase tracking-[.18em] text-gold-light">Discover Utsah</Link></Reveal>
              </div>
            </div>
          }
        />
      </div>
    </PinTrack>
  );
}
