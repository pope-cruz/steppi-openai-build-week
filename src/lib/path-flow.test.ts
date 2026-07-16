import { describe, expect, it } from "vitest";

import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

import { pathFlowReducer } from "./path-flow";

describe("path flow state", () => {
  it("preserves the confirmed profile through failure and retry", () => {
    const confirmed = pathFlowReducer(null, {
      type: "confirm",
      profile: VALID_PROFILE_FIXTURE,
    });
    const loading = pathFlowReducer(confirmed, { type: "start" });
    const failed = pathFlowReducer(loading, {
      type: "fail",
      code: "timeout",
      message: "Please try again.",
      retryable: true,
    });
    const retried = pathFlowReducer(failed, { type: "start" });

    expect(failed?.confirmedProfile).toBe(VALID_PROFILE_FIXTURE);
    expect(failed?.request).toMatchObject({ status: "error", retryable: true });
    expect(retried?.confirmedProfile).toBe(VALID_PROFILE_FIXTURE);
    expect(retried?.request.status).toBe("loading");
  });

  it("transitions from a confirmed profile to exactly three branch previews", () => {
    const confirmed = pathFlowReducer(null, {
      type: "confirm",
      profile: VALID_PROFILE_FIXTURE,
    });
    const succeeded = pathFlowReducer(confirmed, {
      type: "succeed",
      branches: DEMO_PATH_BRANCHES,
    });

    expect(succeeded?.confirmedProfile).toBe(VALID_PROFILE_FIXTURE);
    expect(succeeded?.request).toEqual({
      status: "success",
      branches: DEMO_PATH_BRANCHES,
    });
  });
});
