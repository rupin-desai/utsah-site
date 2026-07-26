'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { navigation } from './site-data';

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="absolute inset-x-0 top-0 z-30 text-white">
      <nav className="page-shell flex items-center justify-between py-5" aria-label="Main navigation">
        <Link href="/" aria-label="Utsah Events home"><Image src="/assets/utsah-logo.png" alt="Utsah Events" width={112} height={48} priority className="h-10 w-auto object-contain" /></Link>
        <div className="hidden items-center gap-7 text-sm font-medium md:flex">{navigation.map((item) => <Link key={item.href} href={item.href} className="transition hover:text-gold-light">{item.label}</Link>)}</div>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-menu" className="grid size-10 place-items-center border border-white/35 md:hidden"><span className="sr-only">Toggle menu</span><span className="grid gap-1.5"><i className="block h-px w-5 bg-white" /><i className="block h-px w-5 bg-white" /><i className="block h-px w-5 bg-white" /></span></button>
      </nav>
      {open && <div id="mobile-menu" className="border-y border-white/15 bg-ink/95 px-5 py-6 backdrop-blur md:hidden">{navigation.map((item) => <Link onClick={() => setOpen(false)} key={item.href} href={item.href} className="block border-b border-white/10 py-4 text-lg">{item.label}</Link>)}</div>}
    </header>
  );
}
