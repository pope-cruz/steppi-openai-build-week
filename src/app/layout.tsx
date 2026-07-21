import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Steppi — Explore what comes next",
    template: "%s | Steppi",
  },
  description:
    "A transparent career exploration tool for high-school and college students.",
};

export const viewport: Viewport = {
  themeColor: "#fefffc",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      className={`${geist.variable} ${bricolage.variable}`}
      data-scroll-behavior="smooth"
      lang="en"
    >
      <body>{children}</body>
    </html>
  );
}
