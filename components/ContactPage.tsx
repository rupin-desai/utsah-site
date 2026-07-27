import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import StandardPage from './StandardPage';
import { DISTANCE, Reveal, SplitText } from '@/components/motion/reveal';

export default function ContactPage() {
  return <StandardPage eyebrow="Get in touch" title="Let’s make something memorable" description="Tell us about your occasion. We’ll help turn it into an experience people remember." image="/assets/hero/hero-3.jpg"><div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
    <div>
      <p className="display text-3xl"><SplitText text="Start with a hello" /></p>
      <Reveal className="mt-8 space-y-5 text-stone-700" delay={0.2}><p><b>Call</b><br /><a href="tel:+918200395197" className="hover:text-gold">+91 82003 95197</a></p><p><b>Email</b><br /><a href="mailto:sales@utsahevents.com" className="hover:text-gold">sales@utsahevents.com</a></p><p><b>Based in</b><br />Bardoli, Gujarat</p></Reveal>
      <Reveal className="mt-8" delay={0.35} distance={DISTANCE.small}><Button render={<Link href="https://wa.me/918200395197" />} className="rounded-none px-5 py-3 text-xs uppercase tracking-[.16em]">WhatsApp us</Button></Reveal>
    </div>
    <Reveal delay={0.15}><Card className="rounded-none bg-white py-0"><CardContent className="p-6 sm:p-8"><form className="grid gap-5" action="mailto:sales@utsahevents.com" method="post" encType="text/plain"><label className="grid gap-2 text-sm font-bold">Your name<Input required name="name" className="rounded-none" /></label><label className="grid gap-2 text-sm font-bold">Email<Input required type="email" name="email" className="rounded-none" /></label><label className="grid gap-2 text-sm font-bold">Tell us about your event<Textarea required name="message" rows={5} className="rounded-none" /></label><Button type="submit" className="rounded-none px-5 py-3 text-xs uppercase tracking-[.16em]">Send enquiry</Button></form></CardContent></Card></Reveal>
  </div></StandardPage>;
}
