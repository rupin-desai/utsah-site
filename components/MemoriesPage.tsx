import Image from "next/image";
import Link from "next/link";
import StandardPage from "./StandardPage";
import { DISTANCE, Reveal, RevealGroup, RevealItem, SplitText } from "@/components/motion/reveal";

const memories = [
  ["Yesha & Mitesh", "/assets/memories/yesha-mitesh/1.jpeg"],
  ["Shubha & Kunal", "/assets/memories/shubha-kunal/1.jpeg"],
  ["Monil & Purnima", "/assets/memories/monil-purnima/1.jpeg"],
  ["Lavesh & Pooja", "/assets/memories/lavesh-pooja/1.jpeg"],
  ["Dillion & Komal", "/assets/memories/dillion-komal/1.jpeg"],
];
export default function MemoriesPage() {
  return (
    <StandardPage
      eyebrow="Our portfolio"
      title="Our memories"
      description="A collection of celebrations held close."
      image="/assets/hero/hero-4.jpg"
    >
      <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {memories.map(([name, image]) => (
          <RevealItem as="article" key={name}>
            <div className="relative aspect-[4/3]">
              <Image
                src={image}
                alt={name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
            <h2 className="display mt-4 text-2xl">{name}</h2>
          </RevealItem>
        ))}
      </RevealGroup>
      <Reveal className="mt-16 bg-ink p-10 text-center text-white">
        <p className="display text-3xl">
          <SplitText
            text="Want your celebration here"
            accent={<span className="text-gold">?</span>}
            delay={0.1}
          />
        </p>
        <Reveal className="mt-6" delay={0.4} distance={DISTANCE.small}>
          <Link
            href="/contact"
            className="inline-block text-sm font-bold uppercase tracking-[.16em] text-gold-light"
          >
            Start planning
          </Link>
        </Reveal>
      </Reveal>
    </StandardPage>
  );
}
