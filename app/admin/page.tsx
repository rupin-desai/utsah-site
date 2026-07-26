import data from '@/content/admin.json';
import LegacyPage from '@/components/LegacyPage';

export const metadata = {
  title: "Utsah Events — Full-Service Event Planning | Bardoli, Gujarat",
  description: "Utsah Events — premium event planning. Weddings, corporate events, and celebrations crafted with passion in Bardoli, Gujarat.",
};

export default function Page() {
  return <LegacyPage data={data} />;
}
