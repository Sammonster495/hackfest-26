import Script from "next/script";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: "Hackfest'26 – Codequest: The Grand Voyage",
  description:
    "Hackfest is a 36-hour National Level Hackathon organised by Finite Loop Club at NMAMIT, Nitte. Win from a ₹4,00,000+ prize pool.",
  url: "https://hackfest.dev",
  startDate: "2026-04-17T09:00:00+05:30",
  endDate: "2026-04-19T21:00:00+05:30",
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  image: "https://hackfest.dev/logos/hflogowithbg.webp",
  organizer: {
    "@type": "Organization",
    name: "Finite Loop Club",
    url: "https://finiteloop.club",
  },
  location: {
    "@type": "Place",
    name: "NMAM Institute of Technology",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Nitte",
      addressLocality: "Karkala",
      addressRegion: "Karnataka",
      postalCode: "574110",
      addressCountry: "IN",
    },
  },
};

export function JsonLd() {
  return (
    <Script
      id="json-ld"
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: injecting json-ld
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      strategy="beforeInteractive"
    />
  );
}
