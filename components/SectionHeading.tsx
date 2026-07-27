import { DISTANCE, Reveal, SplitText } from '@/components/motion/reveal';

type SectionHeadingProps = { eyebrow: string; title: string; centered?: boolean };

// No afterIntro: section headings are always below the fold, so the viewport
// trigger is the right one.
export default function SectionHeading({ eyebrow, title, centered = false }: SectionHeadingProps) {
  return (
    <div className={centered ? 'text-center' : ''}>
      <Reveal as="p" className="eyebrow" distance={DISTANCE.small}>
        {eyebrow}
      </Reveal>
      <h2 className="display mt-3 text-4xl leading-tight sm:text-5xl">
        <SplitText text={title} delay={0.08} />
      </h2>
    </div>
  );
}
