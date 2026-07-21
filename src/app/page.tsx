import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "AI guidance counsellor for high-school students",
  description:
    "Steppi helps high-school students turn what they know about themselves into varied career roles they can understand, question, and explore.",
};

export default function Home() {
  return <LandingPage />;
}
