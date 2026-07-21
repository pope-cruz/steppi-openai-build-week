import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LandingPage } from "@/components/landing/landing-page";
import { notebookRoles } from "@/components/landing/open-notebook-preview";

describe("LandingPage", () => {
  it("positions Steppi as a career exploration tool for high-school and college students", () => {
    const markup = renderToStaticMarkup(<LandingPage />);

    expect(markup).toContain("Career exploration for high-school and college students");
    expect(markup).toContain("AI helps Steppi connect what you share to less obvious roles");
    expect(markup).toContain("Possibilities, not predictions");
    expect(markup).toContain("Current study and career facts include sources");
    expect(markup).not.toContain("AI guidance counsellor");
    expect(markup).not.toContain("Grade 11 students");
    expect(markup).not.toContain("profile hypothesis");
    expect(markup).not.toContain("find your perfect match");
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
