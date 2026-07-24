import data from '@/content/terms.json';
import LegacyPage from '@/components/LegacyPage';

export const metadata = {
  title: "Terms & Conditions — Utsah Events",
  description: "Utsah Events terms and conditions for our event planning services.",
};

export default function Page() {
  return <LegacyPage data={data} />;
}
