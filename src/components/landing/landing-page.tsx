import { ArrowRight, BookOpenCheck, Check, PencilLine, Sparkles } from "lucide-react";
import Link from "next/link";

import { OpenNotebookPreview } from "@/components/landing/open-notebook-preview";
import { buttonVariants } from "@/components/ui/button";
import { INTAKE_PATH } from "@/lib/product";
import { cn } from "@/lib/utils";

const trustPoints = [
  [Sparkles, "Possibilities, not predictions"],
  [PencilLine, "You can correct what Steppi understood"],
  [BookOpenCheck, "Current study and career facts include sources"],
] as const;

export function LandingPage() {
  return (
    <main className="landing-page min-h-[100dvh] overflow-hidden">
      <header className="landing-header">
        <div className="landing-container landing-header__inner">
          <Link className="landing-wordmark" href="/" aria-label="Steppi home">
            Steppi<span>.</span>
          </Link>
          <nav aria-label="Landing page navigation" className="landing-nav">
            <a href="#how-it-works">How it works</a>
            <a href="#what-youll-explore">What you&apos;ll explore</a>
          </nav>
          <Link className={cn(buttonVariants(), "landing-cta landing-header__cta")} href={INTAKE_PATH}>
            Start exploring
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="landing-container landing-hero">
        <div className="landing-hero__copy">
          <p className="landing-eyebrow">Career exploration for high-school and college students</p>
          <h1>
            <span>Start with what you know.</span>
            <span>Open up what&apos;s possible.</span>
          </h1>
          <p className="landing-hero__summary">
            Share what you enjoy, avoid, and wonder about—from classes and projects to work and life outside school.
            Steppi opens it into varied career roles you can understand and explore.
          </p>
          <div className="landing-hero__actions">
            <Link className={cn(buttonVariants({ size: "lg" }), "landing-cta")} href={INTAKE_PATH}>
              Start exploring
              <ArrowRight aria-hidden="true" />
            </Link>
            <a className="landing-text-link" href="#how-it-works">
              See how it works
            </a>
          </div>
          <p className="landing-safety">
            No aptitude scores, rankings, or &ldquo;perfect match.&rdquo; You decide what is worth a closer look.
          </p>
        </div>

        <div className="landing-hero__preview">
          <OpenNotebookPreview />
        </div>
      </section>

      <section aria-label="How Steppi earns trust" className="landing-container landing-trust-strip">
        <ul>
          {trustPoints.map(([Icon, label]) => (
            <li key={label}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="conversation-title" className="landing-container landing-conversation" id="how-it-works">
        <div className="landing-section-copy">
          <h2 id="conversation-title">A conversation, not a test.</h2>
          <p>
            Start with classes, projects, jobs, responsibilities, activities, or hobbies. Uncertainty is useful context
            too. AI helps Steppi connect what you share to less obvious roles; you can correct its read before opening
            the role space.
          </p>
        </div>
        <div aria-label="Example intake conversation" className="conversation-example" role="group">
          <div className="conversation-turn conversation-turn--steppi">
            <span>Steppi</span>
            <p>What have you enjoyed doing lately, in or outside school?</p>
          </div>
          <div className="conversation-turn conversation-turn--student">
            <span>Student</span>
            <p>I like presenting our group&apos;s ideas and making the final project easier to understand.</p>
          </div>
          <div className="conversation-turn conversation-turn--steppi">
            <span>Steppi</span>
            <p>What part feels best: shaping the idea, explaining it, or helping the group work together?</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="role-title" className="landing-role-section" id="what-youll-explore">
        <div className="landing-container landing-role-layout">
          <div className="role-spotlight">
            <div className="role-spotlight__heading">
              <span>One possibility from the notebook</span>
              <h2 id="role-title">Exhibition designer</h2>
              <p>Shapes how people experience stories, objects, and ideas in physical spaces.</p>
            </div>
            <div className="role-spotlight__detail">
              <div>
                <h3>Why it may fit</h3>
                <p>Your interest in presenting ideas could translate into making complex stories clear and memorable.</p>
              </div>
              <div>
                <h3>Why it may not</h3>
                <p>The work can involve detailed coordination, deadlines, and compromises with many collaborators.</p>
              </div>
              <div>
                <h3>Day to day</h3>
                <p>You might research a story, sketch visitor journeys, review models, and coordinate with writers and builders.</p>
              </div>
            </div>
          </div>
          <aside className="role-experiment">
            <Check aria-hidden="true" />
            <h3>Try it without choosing it</h3>
            <p>Redesign a display in your school, campus, or community and ask three people what they notice first.</p>
          </aside>
        </div>
      </section>

      <section aria-labelledby="follow-up-title" className="landing-container landing-follow-up">
        <div className="landing-section-copy landing-follow-up__copy">
          <h2 id="follow-up-title">Ask what you actually want to know.</h2>
          <p>
            Ask about the work, what you could study, how your current studies connect, or how to try the role. Steppi
            checks current sources when your question needs them.
          </p>
        </div>
        <div aria-label="Example role conversation" className="follow-up-example" role="group">
          <div className="follow-up-question">How much of this job is creative, and how much is organizing people?</div>
          <div className="follow-up-answer">
            <span>Steppi</span>
            <p>
              Both matter. You would shape the visitor experience, but good ideas only become real through planning,
              feedback, and coordination with specialists.
            </p>
          </div>
          <details>
            <summary>When current facts need sources</summary>
            <p>Programs, costs, requirements, and local opportunities include links and the date checked.</p>
          </details>
        </div>
      </section>

      <section className="landing-container landing-final-cta">
        <p>You do not need to choose today. You only need a useful next question.</p>
        <Link className={cn(buttonVariants({ size: "lg" }), "landing-cta")} href={INTAKE_PATH}>
          Start exploring
          <ArrowRight aria-hidden="true" />
        </Link>
      </section>

      <footer className="landing-container landing-footer">
        <Link className="landing-wordmark" href="/">
          Steppi<span>.</span>
        </Link>
        <p>A career exploration tool for students figuring out what work could look like.</p>
      </footer>
    </main>
  );
}
