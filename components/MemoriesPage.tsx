import Image from "next/image";
import Link from "next/link";
import StandardPage from "./StandardPage";
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
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {memories.map(([name, image]) => (
          <article key={name}>
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
          </article>
        ))}
      </div>
      <div className="mt-16 bg-ink p-10 text-center text-white">
        <p className="display text-3xl">
          Want your celebration here<span className="text-gold">?</span>
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-block text-sm font-bold uppercase tracking-[.16em] text-gold-light"
        >
          Start planning
        </Link>
      </div>
    </StandardPage>
  );
}
