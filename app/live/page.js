import EventGalleryPage from '@/components/EventGalleryPage';

export const metadata = {
  title: "Live Events — Utsah Events",
  description: "Utsah Events produces live events in Bardoli, Gujarat — concerts, festivals, and public celebrations with full-scale production.",
};

export default function Page() {
  return <EventGalleryPage title="Live events" description="High-energy production for the moments everyone talks about." cover="/assets/events/live/cover.jpeg" images={['/assets/events/live/l1.jpeg', '/assets/events/live/l2.jpeg', '/assets/events/live/l3.jpeg', '/assets/events/live/l4.jpeg', '/assets/events/live/l5.jpeg', '/assets/events/live/l6.jpeg']} />;
}
