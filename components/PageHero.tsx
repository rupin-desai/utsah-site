import { DISTANCE, Reveal, SplitText } from '@/components/motion/reveal';

type PageHeroProps = { eyebrow: string; title: string; description?: string; image: string };

// afterIntro throughout: the intro curtain covers the viewport on every hard
// load of every route, not just the homepage, and this hero is always under it.
export default function PageHero({ eyebrow, title, description, image }: PageHeroProps) {
  return (
    <section className="relative isolate flex min-h-[48svh] items-end overflow-hidden bg-ink pb-14 pt-28 text-white">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center opacity-45"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/45 to-ink/20" />
      <div className="page-shell">
        <Reveal as="p" className="eyebrow" distance={DISTANCE.small} afterIntro>
          {eyebrow}
        </Reveal>
        <h1 className="display mt-4 max-w-3xl text-5xl leading-[.95] sm:text-7xl">
          <SplitText text={title} delay={0.12} afterIntro />
        </h1>
        {description && (
          <Reveal
            as="p"
            className="mt-6 max-w-xl text-base leading-7 text-stone-200"
            delay={0.45}
            afterIntro
          >
            {description}
          </Reveal>
        )}
      </div>
    </section>
  );
}
