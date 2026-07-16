import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { SiteHeader } from "@/components/shell/site-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="min-h-screen">
      <SiteHeader context="That path is not on the map" />
      <section className="page-container grid min-h-[calc(100vh-5rem)] place-items-center py-16">
        <div className="max-w-[38rem] text-center">
          <p className="eyebrow justify-center">404 · Unmapped path</p>
          <h1 className="font-display mt-3 text-balance text-4xl leading-tight text-ink sm:text-5xl">
            We could not find this page.
          </h1>
          <p className="mx-auto mt-5 max-w-[30rem] leading-7 text-muted">
            The link may be out of date, but you can return to Steppi’s starting point.
          </p>
          <Link className={cn(buttonVariants({ variant: "secondary" }), "mt-8")} href="/">
            <ArrowLeft />
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
