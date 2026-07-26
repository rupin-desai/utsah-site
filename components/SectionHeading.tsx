type SectionHeadingProps = { eyebrow: string; title: string; centered?: boolean };

export default function SectionHeading({ eyebrow, title, centered = false }: SectionHeadingProps) {
  return <div className={centered ? 'text-center' : ''}><p className="eyebrow">{eyebrow}</p><h2 className="display mt-3 text-4xl leading-tight sm:text-5xl">{title}<span className="text-gold">.</span></h2></div>;
}
