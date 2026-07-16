import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

import { PathPreview } from "@/components/landing/path-preview";
import { SiteHeader } from "@/components/shell/site-header";
import { buttonVariants } from "@/components/ui/button";
import { INTAKE_PATH } from "@/lib/product";
import { cn } from "@/lib/utils";

const steps = [
  ["01", "Share what matters", "Your interests, experiences, and real-life constraints start the conversation."],
  ["02", "Check the understanding", "Facts, inferences, and open questions stay distinct—and correctable."],
  ["03", "Explore, don’t predict", "Compare three different directions and choose what is worth researching."],
] as const;

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <SiteHeader />

      <section className="page-container landing-hero">
        <div className="landing-hero__copy">
          <p className="eyebrow">A calmer way to explore what comes next</p>
          <h1 className="font-display text-balance text-[clamp(2.65rem,5.3vw,4.8rem)] leading-[0.98] tracking-[-0.052em] text-ink">
            You don’t need your whole future figured out.
          </h1>
          <p className="max-w-[39rem] text-pretty text-[1.05rem] leading-7 text-graphite sm:text-lg sm:leading-8">
            Steppi helps you turn what you know about yourself into a few
            realistic directions you can question, compare, and research.
          </p>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link
              className={cn(buttonVariants({ size: "lg" }), "group")}
              href={INTAKE_PATH}
            >
              Start exploring
              <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <span className="inline-flex items-center gap-2 text-sm text-muted">
              <Check aria-hidden="true" className="size-4 text-success" />
              Built for exploration, not prediction
            </span>
          </div>

          <p className="max-w-[34rem] text-sm leading-6 text-muted">
            Your answers should guide the map—not lock you into a label. You
            will be able to correct assumptions before exploring any path.
          </p>
        </div>

        <div className="landing-hero__preview">
          <PathPreview />
        </div>
      </section>

      <section aria-labelledby="how-steppi-works" className="page-container pb-12 sm:pb-16">
        <div className="border-t border-border pt-8 sm:pt-10">
          <h2 className="sr-only" id="how-steppi-works">
            How Steppi works
          </h2>
          <ol className="grid gap-8 md:grid-cols-3 md:gap-0">
            {steps.map(([number, title, description], index) => (
              <li
                className={cn(
                  "grid grid-cols-[2.25rem_1fr] gap-x-4 md:block md:px-7",
                  index === 0 && "md:pl-0",
                  index > 0 && "md:border-l md:border-border",
                )}
                key={number}
              >
                <span className="row-span-2 font-display text-2xl text-primary/75 md:block md:mb-5">
                  {number}
                </span>
                <h3 className="mb-1 text-base font-semibold text-ink">{title}</h3>
                <p className="max-w-[21rem] text-sm leading-6 text-muted">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
