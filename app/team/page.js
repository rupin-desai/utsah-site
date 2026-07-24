import data from '@/content/team.json';
import LegacyPage from '@/components/LegacyPage';

export const metadata = {
  title: "Our Teams — Utsah Events | Bardoli, Gujarat",
  description: "Meet the team behind Utsah Events — the planners, coordinators, and creatives crafting celebrations in Bardoli, Gujarat.",
};

export default function Page() {
  return <LegacyPage data={data} />;
}
