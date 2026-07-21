import { IntakeProfileDemo } from "@/app/intake/intake-profile-demo";
import { SiteHeader } from "@/components/shell/site-header";

export const metadata = {
  title: "Student intake",
};

export default function IntakeFoundationPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader context="Career exploration · a short conversation" />
      <section className="page-container py-14 sm:py-20">
        <IntakeProfileDemo />
      </section>
    </main>
  );
}
