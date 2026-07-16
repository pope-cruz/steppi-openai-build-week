import { SiteHeader } from "@/components/shell/site-header";

export default function Loading() {
  return (
    <main aria-busy="true" aria-live="polite" className="min-h-screen">
      <SiteHeader context="Finding your place…" />
      <div className="page-container grid min-h-[calc(100vh-5rem)] place-items-center py-16">
        <div className="w-full max-w-[34rem] text-center">
          <div className="loading-orbit mx-auto mb-8" />
          <p className="font-display text-3xl text-ink">Opening Steppi…</p>
          <p className="mt-3 text-sm text-muted">Your place in the exploration is being prepared.</p>
        </div>
      </div>
    </main>
  );
}
