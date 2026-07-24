import data from '@/content/events.json';
import LegacyPage from '@/components/LegacyPage';

export const metadata = {
  title: "Events — Utsah Events | Bardoli, Gujarat",
  description: "Explore Utsah Events — weddings, corporate events, and live celebrations crafted with passion in Bardoli, Gujarat.",
};

export default function Page() {
  return <LegacyPage data={data} />;
}
