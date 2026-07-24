import data from '@/content/wedding.json';
import LegacyPage from '@/components/LegacyPage';

export const metadata = {
  title: "Wedding — Utsah Events",
  description: "Utsah Events designs and manages weddings in Bardoli, Gujarat — from intimate ceremonies to grand celebrations, crafted with passion and precision.",
};

export default function Page() {
  return <LegacyPage data={data} />;
}
