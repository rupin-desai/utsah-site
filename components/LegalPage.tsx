import StandardPage from './StandardPage';
import { DISTANCE, RevealGroup, RevealItem } from '@/components/motion/reveal';

type LegalPageProps = { title: string; sections: [string, string][] };

export default function LegalPage({ title, sections }: LegalPageProps) {
  return <StandardPage eyebrow="Utsah Events" title={title} image="/assets/hero/hero-5.jpg"><RevealGroup as="article" className="mx-auto max-w-3xl space-y-10 text-stone-700">{sections.map(([heading, body], index) => <RevealItem as="section" key={heading} distance={DISTANCE.small}><h2 className="display text-2xl text-stone-900">{index + 1}. {heading}</h2><p className="mt-3 leading-7">{body}</p></RevealItem>)}</RevealGroup></StandardPage>;
}
