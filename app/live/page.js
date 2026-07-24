import data from '@/content/live.json';
import LegacyPage from '@/components/LegacyPage';

export const metadata = {
  title: "Live Events — Utsah Events",
  description: "Utsah Events produces live events in Bardoli, Gujarat — concerts, festivals, and public celebrations with full-scale production.",
};

export default function Page() {
  return <LegacyPage data={data} />;
}
