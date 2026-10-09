import { DISTANCE, Reveal, SplitText } from '@/components/motion/reveal';
import { EYEBROW, EyebrowLabel } from './Eyebrow';

type SectionHeadingProps = { eyebrow?: string; title: string; index?: string; centered?: boolean };

// No afterIntro: section headings are always below the fold, so the viewport
// trigger is the right one. The eyebrow is optional: the home page runs
// without chapter marks.
export default function SectionHeading({ eyebrow, title, index, centered = false }: SectionHeadingProps) {
  return (
    <div className={centered ? 'text-center' : ''}>
      {eyebrow ? (
        <Reveal as="p" className={`${EYEBROW} ${centered ? 'justify-center' : ''}`} distance={DISTANCE.small}>
          <EyebrowLabel index={index}>{eyebrow}</EyebrowLabel>
        </Reveal>
      ) : null}
      <h2 className={`display-lg text-balance ${eyebrow ? 'mt-5' : ''}`}>
        <SplitText text={title} delay={0.08} />
      </h2>
    </div>
  );
}
