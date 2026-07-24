import data from '@/content/corporate.json';
import LegacyPage from '@/components/LegacyPage';

export const metadata = {
  title: "Corporate Events — Utsah Events",
  description: "Utsah Events plans and executes corporate events in Bardoli, Gujarat — conferences, launches, and celebrations built for brands.",
};

export default function Page() {
  return <LegacyPage data={data} />;
}
