import type { Metadata } from "next";
import { Crimson_Text, Pirata_One, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { SessionProvider } from "next-auth/react";
import { ToasterWrapper } from "~/components/providers/toaster-wrapper";
import { DayNightProvider } from "~/components/providers/useDayNight";
import { CompassFloatingButton } from "~/components/ui/compass-floating-button";
import { GlobalLoader } from "~/components/ui/global-loader";
import { RegistrationMarquee } from "~/components/ui/registration-marquee";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import "./globals.css";
import { LoaderProvider } from "~/components/providers/loader-context";
import { JsonLd } from "~/components/ui/json-ld";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const pirata = Pirata_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pirata",
});

const crimson = Crimson_Text({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-crimson",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hackfest.dev"),
  title: {
    template: "%s | Hackfest",
    default: "Hackfest'26 - 36-Hour National Level Hackathon",
  },
  description:
    "Hackfest'26 is a 36-hour National Level Hackathon organised by Finite Loop Club at NMAMIT, Nitte. Win from a ₹4,00,000+ prize pool. April 17-19, 2026.",
  keywords: [
    "Hackfest",
    "Hackfest 26",
    "Hackfest 2026",
    "hackathon 2026",
    "national hackathon India",
    "college hackathon India",
    "36 hour hackathon",
    "coding competition",
    "Karnataka Hackathons",
    "Hackathon",
    "Finite Loop Club",
    "NMAMIT hackathon",
    "NMAMIT",
    "Nitte",
  ],
  authors: [{ name: "Finite Loop Club" }],
  alternates: {
    canonical: "https://hackfest.dev",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://hackfest.dev",
    title: "Hackfest - 36-Hour National Level Hackathon",
    description:
      "Hackfest is a 36-hour National Level Hackathon organised by Finite Loop Club at NMAMIT, Nitte. Win from a ₹4,00,000+ prize pool. April 17-19, 2026.",
    siteName: "Hackfest",
    images: [
      {
        url: "/logos/hflogowithbg.webp",
        width: 1200,
        height: 630,
        alt: "Hackfest - 36-Hour National Level Hackathon by Finite Loop Club, NMAMIT",
      },
    ],
  },
  twitter: {
    images: ["/logos/hflogowithbg.webp"],
    card: "summary_large_image",
    title: "Hackfest - 36-Hour National Level Hackathon",
    description:
      "Hackfest is a 36-hour National Level Hackathon organised by Finite Loop Club at NMAMIT, Nitte. Win from a ₹4,00,000+ prize pool. April 17-19, 2026.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${jakarta.variable} ${pirata.variable} ${crimson.variable} antialiased dark select-none`}
      >
        {/* <ReactScan /> */}
        <SessionProvider basePath="/api/auth">
          <DayNightProvider>
            <LoaderProvider>
              <GlobalLoader />
              <RegistrationMarquee />
              {children}
              <ThemeToggle />
              <ToasterWrapper />
              <CompassFloatingButton />
            </LoaderProvider>
          </DayNightProvider>
        </SessionProvider>
        <JsonLd />
        {/* Umami Analytics */}
        <Script
          defer
          src="https://analytics.finiteloop.club/script.js"
          data-website-id="3c904eb5-16f5-428c-9c63-146a683de618"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
