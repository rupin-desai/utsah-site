import Image from "next/image";
import StandardPage from "./StandardPage";
import SectionHeading from "./SectionHeading";

const people = [
  ["Utsav Desai", "Founder", "/assets/founder/utsav.jpeg"],
  ["Dhwani Shah Desai", "Co-founder", "/assets/team/dhwani.jpg"],
  ["Harsh Desai", "Creative lead", "/assets/team/team-1.jpg"],
];
export default function AboutPage() {
  return (
    <StandardPage
      eyebrow="Our story"
      title="The founders"
      description="Planning with precision. Creating with passion. Treating every client like family."
      image="/assets/about-1.jpeg"
    >
      <div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr]">
        <SectionHeading eyebrow="Utsah" title="Built around care" />
        <div className="text-lg leading-8 text-stone-700">
          <p>
            We believe celebrations should feel deeply personal. Our team brings
            calm coordination, creative direction and meticulous delivery to
            every occasion.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {["Precision", "Passion", "Personalisation"].map((value) => (
              <div
                key={value}
                className="border-t-2 border-gold pt-4 text-sm font-bold uppercase tracking-[.12em]"
              >
                {value}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-20">
        <SectionHeading eyebrow="Our people" title="Faces behind the magic" />
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {people.map(([name, role, image]) => (
            <article key={name}>
              <div className="relative aspect-[4/5]">
                <Image
                  src={image}
                  alt={name}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <h3 className="display mt-4 text-2xl">{name}</h3>
              <p className="mt-1 text-sm text-stone-600">{role}</p>
            </article>
          ))}
        </div>
      </div>
    </StandardPage>
  );
}
