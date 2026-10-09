import CurtainButton from './CurtainButton';
import SiteFooter from './SiteFooter';
import SectionHeading from './SectionHeading';
import { DISTANCE, Reveal, SplitText } from '@/components/motion/reveal';
import ToneCanvas from '@/components/motion/ToneCanvas';
import DepthHero from '@/components/home/DepthHero';
import DepthClose from '@/components/home/DepthClose';
import Manifesto from '@/components/home/Manifesto';
import StatsSequence from '@/components/home/StatsSequence';
import CollageZoom from '@/components/home/CollageZoom';
import Chapters from '@/components/home/Chapters';
import ReviewRing from '@/components/home/ReviewRing';
import ThreadSegment from '@/components/home/gold-thread/ThreadSegment';
import { THREAD } from '@/components/home/gold-thread/routes';
import { eventTypes, reviews, stats } from './site-data';

/**
 * One page, one surface. The rules that keep it reading as a single piece:
 *   - one ground, black, end to end: every section declares `data-tone="ink"`
 *     (ToneCanvas can still ease between tones if a section ever asks for
 *     paper again)
 *   - three display sizes: display-xl (full-screen moments), display-lg
 *     (section titles), display-md (statements)
 *   - un-pinned sections share `section-y`; colours inside are `tone/*`, never
 *     a fixed stone shade, so they follow the canvas
 *   - it opens and closes on the same depth trick (DepthStage): a subject cut
 *     out of its photo, standing in front of a type band
 *   - a gold thread is drawn by the scroll from the manifesto to the close,
 *     blooming into a wedding motif in each chapter (components/home/gold-thread)
 */
export default function HomePage() {
  return <ToneCanvas>
    {/* Pinned depth opener: the bride in front of the band, the room behind. */}
    <DepthHero band={[...eventTypes.map((event) => event.title), 'Celebrations with soul']} />

    {/* Pinned: the copy lights up word by word as the reader scrolls. It slides
        up over the hero's still-pinned stage rather than following it. */}
    <Manifesto overlap id="about" copy="UTSAH is a comprehensive planning and coordination service for customised events and weddings. We design, plan and manage every project from *first idea to final farewell.*" links={[{ href: '/events', label: 'Premium event experiences' }, { href: '/about', label: 'Meet our team' }]} thread={THREAD.manifesto} />

    {/* Pinned: one figure owns the screen at a time, counted up by the scroll. */}
    <StatsSequence label="Utsah in numbers" stats={stats} thread={THREAD.stats} />

    {/* What we create: the heading, then one pinned chapter per event type
        (Chapters). Each chapter holds the screen while its stretch of the gold
        thread draws its motif over it, then scrolls away before the next one
        comes. The thread passes the heading here and hands on to the first
        chapter; no overflow clipping above the chapters, or they stop pinning. */}
    <section data-tone="ink" className="relative">
      <div className="relative">
        <ThreadSegment {...THREAD.create} className="z-10" />
        <div className="page-shell flex h-[18svh] flex-col justify-end pb-[3svh]"><SectionHeading title="Moments made personal" /></div>
      </div>
      <Chapters chapters={eventTypes} />
    </section>

    {/* Interlude: a breath before the grid. The thread comes down out of the
        last chapter and draws a horizontal flourish divider across the page,
        with just enough room either side for a pause before the collage. */}
    <section data-tone="ink" aria-hidden="true" className="relative h-[46svh]">
      <ThreadSegment {...THREAD.interlude} />
    </section>

    {/* Pinned: a wall of frames parts and the centre opens onto the event film,
        then dissolves into the ground below. A link on to the full memories
        page follows it. */}
    <CollageZoom title="Memory, made visible" media={{ kind: 'video', src: '/assets/hero-video-optimized.mp4', poster: '/assets/hero/hero-1.jpg' }} />

    {/* The way on to the full archive. It rises out of the collage's dissolve:
        pulled up over the solid ground at the foot of the collage's last
        screen (z-10 keeps it above the stage), so there is no empty screen
        between the film and this. */}
    <section data-tone="ink" className="relative z-10 -mt-[22svh] pb-6 sm:pb-10">
      {/* Heading and copy on the left; the button on the right edge of the
          page shell, centred vertically on that block. Stacked on phones. */}
      <div className="page-shell flex flex-col items-start gap-9 md:flex-row md:items-center md:justify-between md:gap-12">
        <div className="max-w-3xl">
          <h2 className="display-md"><SplitText text="Every celebration, kept" /></h2>
          <Reveal as="p" delay={0.2} distance={DISTANCE.small} className="mt-5 max-w-xl text-base leading-7 text-tone/70">
            Weddings, corporate evenings and live nights, frame by frame. Browse the moments we have made with the people who trusted us with them.
          </Reveal>
        </div>
        <Reveal delay={0.35} distance={DISTANCE.small} className="shrink-0">
          <CurtainButton href="/memories" caps>View all memories</CurtainButton>
        </Reveal>
      </div>
    </section>

    {/* Reviews on a turning drum that surges with the scroll (GSAP). */}
    <ReviewRing label="What clients say" reviews={reviews} />

    {/* The opener's depth trick once more — the close
        shares the footer's ink, so the last screen is one surface. */}
    <DepthClose band={["Let's create lasting memories", "Let's talk"]} ctas={[{ href: 'tel:+918200395197', label: 'Call us' }, { href: 'mailto:sales@utsahevents.com', label: 'Email us' }, { href: 'https://wa.me/918200395197', label: 'WhatsApp us' }]}>
      {/* The footer is the foot of the closing scene, glass over the photo. */}
      <SiteFooter overlay />
    </DepthClose>
    </ToneCanvas>;
}
