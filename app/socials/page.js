import data from '@/content/socials.json';
import LegacyPage from '@/components/LegacyPage';

export const metadata = {
  title: "Socials — Utsah Events | Bardoli, Gujarat",
  description: "Follow Utsah Events on Instagram, YouTube and WhatsApp. See our latest celebrations and moments.",
};

export default function Page() {
  return <LegacyPage data={data} />;
}
