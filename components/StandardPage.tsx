import type { ReactNode } from "react";
import PageHero from "./PageHero";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

type StandardPageProps = { eyebrow: string; title: string; description?: string; image: string; children: ReactNode };

export default function StandardPage({
  eyebrow,
  title,
  description,
  image,
  children,
}: StandardPageProps) {
  return (
    <main>
      <SiteHeader />
      <PageHero
        eyebrow={eyebrow}
        title={title}
        description={description}
        image={image}
      />
      <section className="bg-paper py-16 sm:py-24">
        <div className="page-shell">{children}</div>
      </section>
      <SiteFooter />
    </main>
  );
}
