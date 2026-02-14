import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Pirata_One, Crimson_Text } from "next/font/google";
import Script from "next/script";
import { ToasterWrapper } from "~/components/providers/toaster-wrapper";
import { GlobalLoader } from "~/components/ui/global-loader";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import "./globals.css";
import { DayNightProvider } from "~/components/providers/useDayNight";

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
  title: "Hackfest",
  description:
    "Hackfest is a 36-hour National Level Hackathon organised by Finite Loop Club, NMAMIT, Nitte",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.variable} ${pirata.variable} ${crimson.variable} antialiased dark`}>
        <DayNightProvider>
          <GlobalLoader />
          {children}
          <ThemeToggle />
          <ToasterWrapper />
        </DayNightProvider>
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
