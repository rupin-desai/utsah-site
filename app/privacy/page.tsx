import LegalPage from "@/components/LegalPage";

export const metadata = {
  title: "Privacy Policy — Utsah Events",
  description:
    "Utsah Events privacy policy — how we collect, use, and protect your information.",
};

export default function Page() {
  return (
    <LegalPage
      title="Privacy policy"
      sections={[
        [
          "Information we collect",
          "We collect information you provide when you contact us or enquire about an event.",
        ],
        [
          "How we use information",
          "We use your details to respond to enquiries, coordinate services and improve our work.",
        ],
        [
          "Sharing and security",
          "We only share necessary details with event partners and take reasonable care to protect them.",
        ],
        [
          "Your rights",
          "Contact us to request access, correction or deletion of your personal information.",
        ],
      ]}
    />
  );
}
