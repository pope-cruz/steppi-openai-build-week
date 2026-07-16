import { ArrowLeft, Compass } from "lucide-react";
import Link from "next/link";

import { SiteHeader } from "@/components/shell/site-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Student intake",
};

export default function IntakeFoundationPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader context="Student intake · next build step" />
      <section className="page-container flex min-h-[calc(100vh-5rem)] items-center py-16">
        <div className="mx-auto w-full max-w-[42rem] text-center">
          <div className="mx-auto mb-7 flex size-14 items-center justify-center rounded-full border border-primary/25 bg-primary-soft text-primary">
            <Compass aria-hidden="true" className="size-6" />
          </div>
          <p className="eyebrow justify-center">The path starts here</p>
          <h1 className="font-display mb-5 text-balance text-[clamp(2.35rem,6vw,3.5rem)] leading-[1.05] tracking-[-0.045em] text-ink">
            The guided intake is the next step.
          </h1>
          <p className="mx-auto mb-8 max-w-[34rem] text-pretty text-base leading-7 text-muted sm:text-lg">
            This foundation preview establishes Steppi’s experience and design
            direction. The student questions and profile flow have not been
            built yet.
          </p>
          <Link className={cn(buttonVariants({ variant: "secondary" }))} href="/">
            <ArrowLeft />
            Back to the introduction
          </Link>
        </div>
      </section>
    </main>
  );
}
