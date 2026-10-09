export const navigation = [
  { href: "/about", label: "About us" },
  { href: "/events", label: "Events" },
  { href: "/memories", label: "Memories" },
  { href: "/team", label: "Our team" },
  { href: "/contact", label: "Contact" },
];

export const socials = [
  { label: "Instagram", link: "https://www.instagram.com/utsahevents/" },
  { label: "YouTube", link: "https://www.youtube.com/channel/UCCXbVgkD-0XRmWPm9OQuwHw" },
  { label: "WhatsApp", link: "https://api.whatsapp.com/send/?phone=918200395197" },
];

// `gallery` is a handful of the category's strongest frames, shown as the
// home chapter's thumbnails; `stat` is its line from `stats`, where it has one.
export const eventTypes = [
  {
    href: "/wedding",
    title: "Weddings",
    text: "Ceremonies with a point of view, planned down to the smallest gesture.",
    image: "/assets/events/wedding/uw21.jpeg",
    gallery: ["/assets/events/wedding/uw11.jpeg", "/assets/events/wedding/5.jpeg", "/assets/events/wedding/uw18.jpeg", "/assets/events/wedding/uw24.jpeg"],
    stat: ["150+", "weddings planned"],
  },
  {
    href: "/corporate",
    title: "Corporate events",
    text: "Brand experiences that bring people, purpose and production together.",
    image: "/assets/events/corporate/c37.jpeg",
    gallery: ["/assets/events/corporate/c25.jpeg", "/assets/events/corporate/c19.jpeg", "/assets/events/corporate/c23.jpeg", "/assets/events/corporate/c14.jpeg"],
    stat: ["15+", "corporate events"],
  },
  {
    href: "/live",
    title: "Live events",
    text: "High-energy occasions designed to be felt long after the lights fade.",
    image: "/assets/events/live/l14.jpeg",
    gallery: ["/assets/events/live/l18.jpeg", "/assets/events/live/l15.jpeg", "/assets/events/live/l13.jpeg", "/assets/events/live/l8.jpeg"],
  },
] as { href: string; title: string; text: string; image: string; gallery: string[]; stat?: [string, string] }[];

export const stats = [
  ["50k+", "Happy guests"],
  ["150+", "Weddings"],
  ["15+", "Corporate events"],
  ["10+", "Birthdays & showers"],
];

export const reviews = [
  [
    "Jayesh Patel",
    "We had our first experience with Utsah Events and it was superbly organised.",
  ],
  [
    "Bharat Bariya",
    "Amazing food, transport and service. Every part of the experience felt cared for.",
  ],
  [
    "Kamini Patel",
    "A wonderful vacation and event experience. The surprises made every moment special.",
  ],
  // PLACEHOLDERS from here down: stand-ins so the review ring reads full.
  // Replace with real client testimonials (with permission) before launch.
  ["Neha Shah", "From the haldi to the reception, every detail was handled. We simply got to be in the moment."],
  ["Rohan Mehta", "Our annual meet ran to the minute. Staging, sound and hospitality were all first class."],
  ["Priya Desai", "They understood exactly the mood we wanted. The mandap took our breath away."],
  ["Amit Joshi", "Two hundred guests, three days, not one thing out of place. Calm, kind and brilliant."],
  ["Hetal Trivedi", "My daughter's birthday felt like a fairytale. The décor and the little surprises were perfect."],
  ["Kunal Parikh", "The live night was electric. Lighting, artists and crowd flow were spot on."],
  ["Sneha Rao", "They turned our ideas into something far more beautiful than we had imagined."],
  ["Vikram Solanki", "Professional from the first call to the last guest. We will be back for every celebration."],
  ["Riya Kapoor", "Our sangeet was pure joy. The choreography and stage design made everyone dance."],
] as [name: string, quote: string][];
