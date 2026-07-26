type PageHeroProps = { eyebrow: string; title: string; description?: string; image: string };

export default function PageHero({ eyebrow, title, description, image }: PageHeroProps) {
  return (
    <section className="relative isolate flex min-h-[48svh] items-end overflow-hidden bg-ink pb-14 pt-28 text-white">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center opacity-45"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/45 to-ink/20" />
      <div className="page-shell">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display mt-4 max-w-3xl text-5xl leading-[.95] sm:text-7xl">
          {title}
          <span className="text-gold">.</span>
        </h1>
        {description && (
          <p className="mt-6 max-w-xl text-base leading-7 text-stone-200">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
