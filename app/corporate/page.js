import EventGalleryPage from '@/components/EventGalleryPage';

export const metadata = {
  title: "Corporate Events — Utsah Events",
  description: "Utsah Events plans and executes corporate events in Bardoli, Gujarat — conferences, launches, and celebrations built for brands.",
};

export default function Page() {
  return <EventGalleryPage title="Corporate events" description="Experiences that move brands and bring people together." cover="/assets/events/corporate/cover.jpeg" images={['/assets/events/corporate/c1.jpeg', '/assets/events/corporate/c2.jpeg', '/assets/events/corporate/c3.jpeg', '/assets/events/corporate/c4.jpeg', '/assets/events/corporate/c5.jpeg', '/assets/events/corporate/c6.jpeg']} />;
}
