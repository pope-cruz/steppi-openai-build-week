import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DEMO_CONFIRMATION_SUMMARY } from "@/lib/demo-profile";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

import {
  ProfileConfirmation,
  ProfileDetails,
  pathGenerationRequest,
} from "./profile-confirmation";

describe("student-approved profile confirmation", () => {
  it("renders only the warm two-sentence reflection as primary content", () => {
    const markup = renderToStaticMarkup(
      <ProfileConfirmation
        confirmationSummary={DEMO_CONFIRMATION_SUMMARY}
        developmentPathFixture="success"
        onRestart={() => undefined}
        profile={VALID_PROFILE_FIXTURE}
      />,
    );

    expect(markup).toContain("Here’s what Steppi heard.");
    expect(markup).toContain(DEMO_CONFIRMATION_SUMMARY);
    expect(markup).toContain("Good to go!");
    expect(markup).toContain("Let me refine this");
    expect(markup).toContain("See the details Steppi is using");
    expect(markup).toContain("max-w-[55rem]");
    expect(markup).toContain("text-[clamp(1.4rem,2.8vw,2.5rem)]");
    expect(markup).toContain("leading-[1.35]");
    expect(markup).not.toContain("Build my map");
    expect(markup).not.toContain("Refine this first");
    expect(markup).not.toContain("data-profile-refinement-transcript");
  });

  it("keeps structured profile distinctions in a collapsed disclosure", () => {
    const markup = renderToStaticMarkup(
      <ProfileDetails profile={VALID_PROFILE_FIXTURE} />,
    );

    expect(markup).toContain("<details");
    expect(markup).not.toContain("<details open");
    expect(markup).toContain("What you shared");
    expect(markup).toContain("Steppi’s tentative read");
    expect(markup).toContain("Practical considerations");
    expect(markup).toContain("What can stay open");
    expect(markup).toContain(VALID_PROFILE_FIXTURE.facts[0].statement);
    expect(markup).not.toContain("sourceAnswerIds");
    expect(markup).not.toContain("inference-collaboration");
  });

  it("sends the complete unchanged profile followed by the approved summary", () => {
    const correction =
      "I am open to programming after all, and I want Steppi to prioritize affordable options. I still want creative, collaborative work.";
    const request = pathGenerationRequest(VALID_PROFILE_FIXTURE, correction);

    expect(Object.keys(request)).toEqual(["profile", "confirmedSummary"]);
    expect(request.profile).toBe(VALID_PROFILE_FIXTURE);
    expect(request.confirmedSummary).toBe(correction);
    expect(request.profile.constraints).toEqual(VALID_PROFILE_FIXTURE.constraints);
  });
});
