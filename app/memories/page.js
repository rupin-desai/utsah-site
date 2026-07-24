import data from '@/content/memories.json';
import LegacyPage from '@/components/LegacyPage';

export const metadata = {
  title: "Memories — Utsah Events",
  description: "Browse our portfolio of weddings and celebrations. Each event is a unique story crafted by Utsah Events.",
};

export default function Page() {
  return <LegacyPage data={data} />;
}
