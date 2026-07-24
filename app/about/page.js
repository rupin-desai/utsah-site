import data from '@/content/about.json';
import LegacyPage from '@/components/LegacyPage';

export const metadata = {
  title: "About Us — Utsah Events | Bardoli, Gujarat",
  description: "Learn about Utsah Events — our story, our team, and our passion for creating magical celebrations in Bardoli, Gujarat.",
};

export default function Page() {
  return <LegacyPage data={data} />;
}
