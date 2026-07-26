'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MenuIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { navigation } from './site-data';

export default function SiteHeader() {
  return <header className="absolute inset-x-0 top-0 z-30 text-white"><nav className="page-shell flex items-center justify-between py-5" aria-label="Main navigation"><Link href="/" aria-label="Utsah Events home"><Image src="/assets/utsah-logo.png" alt="Utsah Events" width={112} height={48} priority className="h-10 w-auto object-contain" /></Link><div className="hidden items-center gap-7 text-sm font-medium md:flex">{navigation.map((item) => <Link key={item.href} href={item.href} className="transition hover:text-gold-light">{item.label}</Link>)}</div><Sheet><SheetTrigger render={<Button variant="outline" size="icon" className="border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white md:hidden" />}><MenuIcon /></SheetTrigger><SheetContent side="right" className="border-white/10 bg-ink text-white"><SheetHeader><SheetTitle className="display text-2xl text-white">Navigate</SheetTitle></SheetHeader><nav className="px-4 pb-6" aria-label="Mobile navigation">{navigation.map((item) => <Link key={item.href} href={item.href} className="block border-b border-white/10 py-4 text-lg hover:text-gold-light">{item.label}</Link>)}</nav></SheetContent></Sheet></nav></header>;
}
