import Image from "next/image";
import Link from "next/link";
import { DISTANCE, Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { navigation } from "./site-data";

export default function SiteFooter() {
  return (
    <footer className="bg-ink py-14 text-stone-300">
      <RevealGroup className="page-shell grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
        <RevealItem distance={DISTANCE.small}>
          <Image
            src="/assets/utsah-logo.png"
            alt="Utsah Events"
            width={120}
            height={50}
            className="h-11 w-auto object-contain"
          />
          <p className="mt-5 max-w-sm text-sm leading-6 text-stone-400">
            Thoughtful celebrations, planned and produced in Bardoli, Gujarat.
          </p>
        </RevealItem>
        <RevealItem
          as="nav"
          aria-label="Footer navigation"
          className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm"
          distance={DISTANCE.small}
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-gold-light"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/privacy">Privacy policy</Link>
          <Link href="/terms">Terms & conditions</Link>
        </RevealItem>
      </RevealGroup>
      <Reveal
        className="page-shell mt-12 border-t border-white/10 pt-5 text-xs text-stone-500"
        distance={DISTANCE.small}
      >
        © {new Date().getFullYear()} Utsah Events. All rights reserved.
      </Reveal>
    </footer>
  );
}
