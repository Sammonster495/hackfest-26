import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ToasterWrapper } from "~/components/providers/toaster-wrapper";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
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
      <body className={`${jakarta.variable} antialiased dark`}>
        {children}
        <ToasterWrapper />
      </body>
    </html>
  );
}
