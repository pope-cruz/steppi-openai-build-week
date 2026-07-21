import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LandingPage } from "@/components/landing/landing-page";
import { notebookRoles } from "@/components/landing/open-notebook-preview";

describe("LandingPage", () => {
  it("positions Steppi as an AI guidance counsellor without claiming to replace one", () => {
    const markup = renderToStaticMarkup(<LandingPage />);

    expect(markup).toContain("AI guidance counsellor for high-school students");
    expect(markup).toContain("does not predict the right career or replace your school counsellor");
    expect(markup).toContain("Possibilities, not predictions");
  });

  it("shows a curated sample from the larger unranked role space", () => {
    const markup = renderToStaticMarkup(<LandingPage />);

    expect(new Set(notebookRoles).size).toBe(7);
    expect(markup).toContain("a sample of unranked career roles");
    expect(markup).toContain("A sample from a larger unranked set");

    for (const role of notebookRoles) {
      expect(markup).toContain(role);
    }
  });

  it("links every primary call to action to the intake", () => {
    const markup = renderToStaticMarkup(<LandingPage />);
    const intakeLinks = markup.match(/href="\/intake"/g) ?? [];

    expect(intakeLinks).toHaveLength(3);
    expect(markup).toContain("Start exploring");
  });
});
