import Image from 'next/image';
import Link from 'next/link';
import PageHero from './PageHero';
import SiteFooter from './SiteFooter';
import SiteHeader from './SiteHeader';

export default function EventGalleryPage({ title, description, cover, images }) {
  return <main><SiteHeader /><PageHero eyebrow="Utsah events" title={title} description={description} image={cover} /><section className="bg-paper py-16 sm:py-24"><div className="page-shell"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{images.map((src, index) => <div key={src} className={index % 7 === 0 ? 'relative min-h-90 sm:col-span-2' : 'relative min-h-72'}><Image src={src} alt={`${title} event moment`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" /></div>)}</div><div className="mt-16 bg-ink px-6 py-12 text-center text-white sm:px-12"><p className="eyebrow">Plan with us</p><h2 className="display mt-3 text-4xl">Make your occasion unforgettable<span className="text-gold">.</span></h2><Link href="/contact" className="mt-7 inline-block border border-gold px-5 py-3 text-sm font-bold uppercase tracking-[.16em] text-gold-light">Talk to our team</Link></div></div></section><SiteFooter /></main>;
}
