import Image from 'next/image';
import Link from 'next/link';
import SiteFooter from './SiteFooter';
import SectionHeading from './SectionHeading';
import { DISTANCE, Reveal, RevealGroup, RevealItem, RevealLink } from '@/components/motion/reveal';
import ParallaxGallery from '@/components/ParallaxGallery';
import ToneCanvas from '@/components/motion/ToneCanvas';
import DepthHero from '@/components/home/DepthHero';
import DepthClose from '@/components/home/DepthClose';
import Manifesto from '@/components/home/Manifesto';
import StatsSequence from '@/components/home/StatsSequence';
import CollageZoom from '@/components/home/CollageZoom';
import { eventTypes, reviews, stats } from './site-data';

/**
 * One page, one surface. The rules that keep it reading as a single piece:
 *   - two tones only, night -> day -> night: each section declares `data-tone`
 *     and ToneCanvas eases the whole ground between them, so there are no
 *     hard cuts between sections
 *   - every section opens on a numbered chapter mark, top left of page-shell
 *   - three display sizes: display-xl (full-screen moments), display-lg
 *     (section titles), display-md (statements)
 *   - un-pinned sections share `section-y`; colours inside are `tone/*`, never
 *     a fixed stone shade, so they follow the canvas
 *   - it opens and closes on the same depth trick (DepthStage): a subject cut
 *     out of its photo, standing in front of a type band
 */
export default function HomePage() {
  return <ToneCanvas>
    {/* Pinned depth opener: the bride in front of the band, the room behind. */}
    <DepthHero band={[...eventTypes.map((event) => event.title), 'Celebrations with soul']} />

    {/* Pinned: the copy lights up word by word as the reader scrolls. It slides
        up over the hero's still-pinned stage rather than following it. */}
    <Manifesto overlap id="about" index="01" eyebrow="Who we are" copy="UTSAH is a comprehensive planning and coordination service for customised events and weddings. We design, plan and manage every project from *first idea to final farewell.*" links={[{ href: '/events', label: 'Premium event experiences' }, { href: '/about', label: 'Meet our team' }]} />

    {/* Pinned: one figure owns the screen at a time, counted up by the scroll. */}
    <StatsSequence index="02" eyebrow="Utsah in numbers" stats={stats} />

    {/* Night turns to day here: the first paper section. */}
    <section data-tone="paper" className="section-y"><div className="page-shell"><SectionHeading index="03" eyebrow="What we create" title="Moments made personal" />
      {/* RevealLink, not RevealItem: the anchor *is* the grid item, and a
          wrapper div would strand min-h-105 and lg:grid-cols-3 on the wrong box. */}
      <RevealGroup className="mt-14 grid gap-5 lg:grid-cols-3">{eventTypes.map((event) => <RevealLink key={event.href} href={event.href} className="group relative min-h-105 overflow-hidden rounded-[6px] bg-tone/10 text-white"><Image src={event.image} alt="" fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(11,11,11,.75),transparent_60%)]" /><div className="absolute inset-x-0 bottom-0 p-7 [text-shadow:0_1px_24px_rgba(0,0,0,.35)]"><h3 className="display text-3xl">{event.title}</h3><p className="mt-3 max-w-sm text-sm leading-6 text-white/85">{event.text}</p><span className="mt-5 inline-block text-xs font-bold uppercase tracking-[.24em] text-gold-light">Explore</span></div></RevealLink>)}</RevealGroup>
    </div></section>

    {/* Pinned: a wall of frames parts and the centre opens onto the event film,
        then dissolves into the paper the gallery starts on. It carries the
        gallery's heading, so the gallery below starts straight in. */}
    <CollageZoom index="04" eyebrow="Selected work" title="Memory, made visible" media={{ kind: 'video', src: '/assets/hero-video-optimized.mp4', poster: '/assets/hero/hero-1.jpg' }} />

    {/* The gallery is deliberately outside page-shell: it runs edge to edge, and
        its own overflow-hidden frame is what crops the drifting columns. */}
    <section data-tone="paper" className="pb-24 sm:pb-32">
      <ParallaxGallery />
      <div className="page-shell"><Reveal className="mt-14" distance={DISTANCE.small}><Link href="/memories" className="inline-flex border-b border-tone pb-2 text-sm font-bold uppercase tracking-[.18em] transition-colors duration-300 hover:border-gold hover:text-gold">View all memories</Link></Reveal></div>
    </section>

    {/* Hairline columns rather than boxed cards — the same editorial rule the
        stats and manifesto use, so nothing here reads as a different site. */}
    <section data-tone="paper" className="section-y"><div className="page-shell"><SectionHeading index="05" eyebrow="Google reviews" title="What clients say" />
      <RevealGroup className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">{reviews.map(([name, quote]) => <RevealItem as="figure" key={name} className="border-t border-tone/20 pt-7"><div className="text-sm tracking-[.2em] text-gold">★★★★★</div><blockquote className="display mt-5 text-2xl leading-snug">“{quote}”</blockquote><figcaption className="mt-6 text-xs font-bold uppercase tracking-[.24em] text-tone/60">{name}</figcaption></RevealItem>)}</RevealGroup>
    </div></section>

    {/* Day back to night, and the opener's depth trick once more — the close
        shares the footer's ink, so the last screen is one surface. */}
    <DepthClose index="06" eyebrow="Start a conversation" band={["Let's create lasting memories", "Let's talk"]} cta={{ href: '/contact', label: 'Contact Utsah' }} />
    <SiteFooter /></ToneCanvas>;
}
