import Image from 'next/image';
import Link from 'next/link';
import SiteFooter from './SiteFooter';
import SectionHeading from './SectionHeading';
import { DISTANCE, Reveal, RevealGroup, RevealItem, RevealLink, SplitText } from '@/components/motion/reveal';
import { eventTypes, reviews, stats } from './site-data';

const gallery = ['/assets/gallery/g27.jpeg', '/assets/gallery/g12.jpeg', '/assets/gallery/g19.jpeg', '/assets/gallery/g15.jpeg'];

export default function HomePage() {
  return <main>
    {/* Hero. Everything here is afterIntro — it sits under the intro curtain
        until ~2800ms, so a viewport trigger would play it unseen. The video and
        gradient layers stay unanimated: they are -z siblings, and a transform on
        them would create a stacking context and flatten the z-ordering. */}
    <section className="relative isolate min-h-svh overflow-hidden bg-ink text-white"><div className="absolute inset-0 -z-20"><video autoPlay muted loop playsInline poster="/assets/hero/hero-1.jpg" className="size-full object-cover"><source src="/assets/hero-video-optimized.mp4" type="video/mp4" /></video></div><div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/65 via-transparent to-ink" /><div className="page-shell flex min-h-svh items-center pb-20 pt-32 sm:pb-28"><div className="mx-auto text-center">
      <Reveal as="p" className="eyebrow" distance={DISTANCE.small} afterIntro>For our future family</Reveal>
      <h1 className="display mt-5 text-[clamp(1.6rem,6.5vw,3.75rem)] leading-[1.05] text-balance">
        <SplitText text={["Let's create magical", 'memories together']} delay={0.12} afterIntro />
      </h1>
      <Reveal as="p" className="mt-7 text-sm uppercase tracking-[.18em] text-stone-200" delay={0.55} afterIntro>Premium event planning · Bardoli, Gujarat</Reveal>
      <Reveal className="mt-10" delay={0.7} distance={DISTANCE.small} afterIntro><Link href="#about" className="inline-flex border-b border-gold pb-2 text-sm font-semibold uppercase tracking-[.18em] text-gold-light">Discover Utsah</Link></Reveal>
    </div></div></section>

    <section id="about" className="bg-paper py-20 sm:py-28"><div className="page-shell">
      {/* RevealItem carries the cell classes verbatim so the gap-px hairline
          trick still works — no extra wrapper in the grid. */}
      <RevealGroup className="grid gap-px bg-stone-300 sm:grid-cols-4">{stats.map(([value, label]) => <RevealItem key={label} className="bg-paper px-5 py-7 text-center" distance={DISTANCE.small}><p className="display text-4xl text-gold">{value}</p><p className="mt-2 text-xs font-bold uppercase tracking-[.14em] text-stone-600">{label}</p></RevealItem>)}</RevealGroup>
      <div className="mt-20 grid items-center gap-12 lg:grid-cols-[.85fr_1.15fr]"><SectionHeading eyebrow="Who we are" title="Celebrations with soul" /><div className="max-w-2xl text-lg leading-8 text-stone-700">
        <Reveal as="p" delay={0.1}>UTSAH is a comprehensive planning and coordination service for customised events and weddings. We design, plan and manage every project from first idea to final farewell.</Reveal>
        <RevealGroup className="mt-8 flex flex-wrap gap-3" delay={0.25}><RevealLink href="/events" className="border border-stone-400 px-5 py-3 text-sm font-semibold hover:border-gold hover:text-gold" distance={DISTANCE.small}>Premium event experiences</RevealLink><RevealLink href="/about" className="border border-stone-400 px-5 py-3 text-sm font-semibold hover:border-gold hover:text-gold" distance={DISTANCE.small}>Meet our team</RevealLink></RevealGroup>
      </div></div>
    </div></section>

    <section className="bg-ink py-20 text-white sm:py-28"><div className="page-shell"><SectionHeading eyebrow="What we create" title="Moments made personal" />
      {/* RevealLink, not RevealItem: the anchor *is* the grid item, and a
          wrapper div would strand min-h-105 and lg:grid-cols-3 on the wrong box. */}
      <RevealGroup className="mt-12 grid gap-5 lg:grid-cols-3">{eventTypes.map((event) => <RevealLink key={event.href} href={event.href} className="group relative min-h-105 overflow-hidden bg-stone-900"><Image src={event.image} alt="" fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover opacity-65 transition duration-700 group-hover:scale-105 group-hover:opacity-45" /><div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/15 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-7"><h3 className="display text-3xl">{event.title}</h3><p className="mt-3 max-w-sm text-sm leading-6 text-stone-200">{event.text}</p><span className="mt-5 inline-block text-xs font-bold uppercase tracking-[.2em] text-gold-light">Explore</span></div></RevealLink>)}</RevealGroup>
    </div></section>

    <section className="bg-paper py-20 sm:py-28"><div className="page-shell"><SectionHeading eyebrow="Selected work" title="Memory, made visible" centered />
      <RevealGroup className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">{gallery.map((src, index) => <RevealItem key={src} className={index === 0 ? 'relative col-span-2 row-span-2 min-h-72' : 'relative min-h-40'}><Image src={src} alt="Utsah event celebration" fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" /></RevealItem>)}</RevealGroup>
      <Reveal className="mt-10 text-center" distance={DISTANCE.small}><Link href="/memories" className="inline-flex border-b border-stone-900 pb-2 text-sm font-bold uppercase tracking-[.18em]">View all memories</Link></Reveal>
    </div></section>

    <section className="bg-stone-100 py-20 sm:py-28"><div className="page-shell"><SectionHeading eyebrow="Google reviews" title="What clients say" centered />
      <RevealGroup className="mt-12 grid gap-5 md:grid-cols-3">{reviews.map(([name, quote]) => <RevealItem as="figure" key={name} className="border border-stone-200 bg-white p-7"><div className="text-gold">★★★★★</div><blockquote className="mt-5 leading-7 text-stone-700">“{quote}”</blockquote><figcaption className="mt-6 text-sm font-bold">{name}</figcaption></RevealItem>)}</RevealGroup>
    </div></section>

    <section className="bg-gold py-20 text-center text-ink"><div className="page-shell">
      <Reveal as="p" className="text-xs font-bold uppercase tracking-[.24em]" distance={DISTANCE.small}>Start a conversation</Reveal>
      {/* accent={null}: the period is part of the sentence here, and a gold one
          would be invisible on bg-gold anyway. */}
      <h2 className="display mt-4 text-4xl sm:text-6xl"><SplitText text="Let's create lasting memories." accent={null} delay={0.08} /></h2>
      <Reveal className="mt-8" delay={0.3} distance={DISTANCE.small}><Link href="/contact" className="inline-block bg-ink px-6 py-4 text-sm font-bold uppercase tracking-[.18em] text-white hover:bg-stone-800">Contact Utsah</Link></Reveal>
    </div></section><SiteFooter /></main>;
}
