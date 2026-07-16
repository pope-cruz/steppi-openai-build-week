import type { Metadata, Viewport } from "next";
import { Fraunces, Geist } from "next/font/google";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Steppi — Explore what comes next",
    template: "%s | Steppi",
  },
  description:
    "A transparent way for Grade 11 students to explore realistic career and college directions.",
};

export const viewport: Viewport = {
  themeColor: "#fefffc",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      className={`${geist.variable} ${fraunces.variable}`}
      data-scroll-behavior="smooth"
      lang="en"
    >
      <body>{children}</body>
    </html>
  );
}
