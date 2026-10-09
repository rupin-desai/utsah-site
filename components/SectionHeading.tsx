import { DISTANCE, Reveal, SplitText } from '@/components/motion/reveal';
import { EYEBROW, EyebrowLabel } from './Eyebrow';

type SectionHeadingProps = { eyebrow: string; title: string; index?: string; centered?: boolean };

// No afterIntro: section headings are always below the fold, so the viewport
// trigger is the right one.
export default function SectionHeading({ eyebrow, title, index, centered = false }: SectionHeadingProps) {
  return (
    <div className={centered ? 'text-center' : ''}>
      <Reveal as="p" className={`${EYEBROW} ${centered ? 'justify-center' : ''}`} distance={DISTANCE.small}>
        <EyebrowLabel index={index}>{eyebrow}</EyebrowLabel>
      </Reveal>
      <h2 className="display-lg mt-5 text-balance">
        <SplitText text={title} delay={0.08} />
      </h2>
    </div>
  );
}
