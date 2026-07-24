import data from '@/content/contact.json';
import LegacyPage from '@/components/LegacyPage';

export const metadata = {
  title: "Contact Us — Utsah Events | Bardoli, Gujarat",
  description: "Get in touch with Utsah Events. Let",
};

export default function Page() {
  return <LegacyPage data={data} />;
}
