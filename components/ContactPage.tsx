import Link from 'next/link';
import StandardPage from './StandardPage';

export default function ContactPage() {
  return (
    <StandardPage eyebrow="Get in touch" title="Let’s make something memorable" description="Tell us about your occasion. We’ll help turn it into an experience people remember." image="/assets/hero/hero-3.jpg">
      <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
        <div><p className="display text-3xl">Start with a hello<span className="text-gold">.</span></p><div className="mt-8 space-y-5 text-stone-700"><p><b>Call</b><br /><a href="tel:+918200395197" className="hover:text-gold">+91 82003 95197</a></p><p><b>Email</b><br /><a href="mailto:sales@utsahevents.com" className="hover:text-gold">sales@utsahevents.com</a></p><p><b>Based in</b><br />Bardoli, Gujarat</p></div><Link href="https://wa.me/918200395197" className="mt-8 inline-block bg-ink px-5 py-3 text-sm font-bold uppercase tracking-[.16em] text-white">WhatsApp us</Link></div>
        <form className="grid gap-5 border border-stone-200 bg-white p-6 sm:p-8" action="mailto:sales@utsahevents.com" method="post" encType="text/plain"><label className="grid gap-2 text-sm font-bold">Your name<input required name="name" className="border border-stone-300 px-4 py-3 font-normal outline-none focus:border-gold" /></label><label className="grid gap-2 text-sm font-bold">Email<input required type="email" name="email" className="border border-stone-300 px-4 py-3 font-normal outline-none focus:border-gold" /></label><label className="grid gap-2 text-sm font-bold">Tell us about your event<textarea required name="message" rows={5} className="border border-stone-300 px-4 py-3 font-normal outline-none focus:border-gold" /></label><button className="bg-ink px-5 py-3 text-sm font-bold uppercase tracking-[.16em] text-white hover:bg-stone-800">Send enquiry</button></form>
      </div>
    </StandardPage>
  );
}
