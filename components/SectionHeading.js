export default function SectionHeading({ eyebrow, title, centered = false }) {
  return <div className={centered ? 'text-center' : ''}><p className="eyebrow">{eyebrow}</p><h2 className="display mt-3 text-4xl leading-tight sm:text-5xl">{title}<span className="text-gold">.</span></h2></div>;
}
