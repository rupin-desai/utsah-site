import LegalPage from '@/components/LegalPage';

export const metadata = {
  title: "Terms & Conditions — Utsah Events",
  description: "Utsah Events terms and conditions for our event planning services.",
};

export default function Page() {
  return <LegalPage title="Terms & conditions" sections={[["Our services", "Utsah Events provides planning, coordination and production services as agreed for each event."], ["Bookings and payments", "Bookings are confirmed according to the proposal and payment schedule shared with you."], ["Cancellations and changes", "Changes or cancellations may affect costs and availability. Please let us know as early as possible."], ["Client responsibilities", "Clients must provide accurate event requirements and timely approvals for a smooth delivery."], ["Liability", "Our liability is limited to the extent permitted by applicable law and the agreed service terms."]]} />;
}
