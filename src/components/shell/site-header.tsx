import Link from "next/link";

import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  context?: string;
  className?: string;
};

export function SiteHeader({ context, className }: SiteHeaderProps) {
  return (
    <header className={cn("relative z-20", className)}>
      <div className="page-container flex min-h-20 items-center justify-between gap-4 border-b border-border py-4">
        <Link
          className="font-display text-[1.45rem] leading-none tracking-[-0.035em] text-ink outline-none focus-visible:focus-ring"
          href="/"
        >
          Steppi<span className="text-primary">.</span>
        </Link>
        <p className="max-w-[12rem] text-right text-xs font-medium leading-snug text-muted sm:max-w-none sm:text-sm">
          {context ?? "For Grade 11 students finding their next step"}
        </p>
      </div>
    </header>
  );
}
