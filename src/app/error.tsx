"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";

import { SiteHeader } from "@/components/shell/site-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen">
      <SiteHeader context="Something interrupted this step" />
      <section className="page-container grid min-h-[calc(100vh-5rem)] place-items-center py-16">
        <div className="max-w-[38rem] text-center">
          <p className="eyebrow justify-center text-error">This page could not finish loading</p>
          <h1 className="font-display mt-3 text-balance text-4xl leading-tight text-ink sm:text-5xl">
            Your next step is still here.
          </h1>
          <p className="mx-auto mt-5 max-w-[32rem] leading-7 text-muted">
            Nothing you entered was changed. Try opening this step again, or return to the introduction.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={reset}>
              <RotateCcw />
              Try again
            </Button>
            <Link className={cn(buttonVariants({ variant: "secondary" }))} href="/">
              <ArrowLeft />
              Return home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
