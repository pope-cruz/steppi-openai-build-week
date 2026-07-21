import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Career exploration for high-school and college students",
  description:
    "Steppi helps high-school and college students turn their interests, studies, and experiences into varied career roles they can understand and explore.",
};

export default function Home() {
  return <LandingPage />;
}
