import data from '@/content/privacy.json';
import LegacyPage from '@/components/LegacyPage';

export const metadata = {
  title: "Privacy Policy — Utsah Events",
  description: "Utsah Events privacy policy — how we collect, use, and protect your information.",
};

export default function Page() {
  return <LegacyPage data={data} />;
}
