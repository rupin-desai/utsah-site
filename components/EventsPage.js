import Image from 'next/image';
import Link from 'next/link';
import SiteFooter from './SiteFooter';
import SiteHeader from './SiteHeader';
import PageHero from './PageHero';
import { eventTypes } from './site-data';

export default function EventsPage() { return <main><SiteHeader /><PageHero eyebrow="Our work" title="Every moment has a story" description="From intimate rituals to large-scale experiences, we shape occasions around the people at their centre." image="/assets/hero/hero-2.jpg" /><section className="bg-paper py-16 sm:py-24"><div className="page-shell space-y-5">{eventTypes.map((event) => <Link key={event.href} href={event.href} className="group grid overflow-hidden bg-ink text-white md:grid-cols-2"><div className="relative min-h-72"><Image src={event.image} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover opacity-75 transition duration-700 group-hover:scale-105" /></div><div className="flex flex-col justify-center p-8 sm:p-12"><p className="eyebrow">Explore</p><h2 className="display mt-3 text-4xl">{event.title}</h2><p className="mt-5 leading-7 text-stone-300">{event.text}</p><span className="mt-8 text-sm font-bold uppercase tracking-[.16em] text-gold-light">View gallery</span></div></Link>)}</div></section><SiteFooter /></main>; }
