import EventGalleryPage from '@/components/EventGalleryPage';

export const metadata = {
  title: "Wedding — Utsah Events",
  description: "Utsah Events designs and manages weddings in Bardoli, Gujarat — from intimate ceremonies to grand celebrations, crafted with passion and precision.",
};

export default function Page() {
  return <EventGalleryPage title="Weddings" description="Every wedding is a world of its own. We make it feel effortless." cover="/assets/events/wedding/cover.jpeg" images={['/assets/events/wedding/uw1.jpeg', '/assets/events/wedding/uw2.jpeg', '/assets/events/wedding/uw3.jpeg', '/assets/events/wedding/uw4.jpeg', '/assets/events/wedding/uw5.jpeg', '/assets/events/wedding/uw6.jpeg']} />;
}
