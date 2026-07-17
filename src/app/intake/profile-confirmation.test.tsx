import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

import {
  ProfileConfirmation,
  ProfileSummary,
  pathGenerationRequest,
} from "./profile-confirmation";

describe("optional profile summary and refinement fork", () => {
  it("renders a concise summary without internal profile metadata", () => {
    const markup = renderToStaticMarkup(
      <ProfileSummary profile={VALID_PROFILE_FIXTURE} />,
    );

    expect(markup).toContain("The choice in front of you");
    expect(markup).toContain("What seems to matter");
    expect(markup).toContain("What should shape the options");
    expect(markup).toContain("What can stay open");
    expect(markup).not.toContain("inference-collaboration");
    expect(markup).not.toContain("sourceAnswerIds");
    expect(markup).not.toContain("medium confidence");
  });

  it("makes map building primary and profile refinement optional", () => {
    const markup = renderToStaticMarkup(
      <ProfileConfirmation
        developmentPathFixture="success"
        developmentProfileRefinementFixture="direct"
        onRestart={() => undefined}
        profile={VALID_PROFILE_FIXTURE}
      />,
    );

    expect(markup).toContain("Here’s what Steppi understood.");
    expect(markup).toContain("Build my map");
    expect(markup).toContain("Refine this first");
    expect(markup).toContain("Refining is optional");
    expect(markup).not.toContain("Confirm this profile");
    expect(markup).not.toContain("Correct this inference");
    expect(markup).not.toContain("Read-only");
    expect(markup).not.toContain("Restart intake");
  });

  it("preserves the exact path-generation request shape", () => {
    const request = pathGenerationRequest(VALID_PROFILE_FIXTURE);
    expect(request).toEqual({ profile: VALID_PROFILE_FIXTURE });
    expect(Object.keys(request)).toEqual(["profile"]);
  });
});
