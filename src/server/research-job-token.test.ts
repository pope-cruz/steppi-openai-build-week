import { describe, expect, it } from "vitest";

import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";
import { DEMO_RESEARCH_QUESTION } from "@/lib/demo-research";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

import {
  openResearchJobToken,
  researchContextDigest,
  researchContextMatches,
  sealResearchJobToken,
} from "./research-job-token";

const secret = "test-secret-not-an-api-key";
const request = {
  profile: VALID_PROFILE_FIXTURE,
  branch: DEMO_PATH_BRANCHES[0],
  question: DEMO_RESEARCH_QUESTION,
};

describe("research job token", () => {
  it("seals the provider identifier without exposing it or student context", () => {
    const job = {
      responseId: "resp_background_test",
      contextDigest: researchContextDigest(request),
      dateChecked: "2026-07-16",
      createdAt: 1_752_643_200_000,
      cancelRequested: false,
    };
    const token = sealResearchJobToken(job, secret);

    expect(token).not.toContain(job.responseId);
    expect(token).not.toContain(DEMO_RESEARCH_QUESTION);
    expect(openResearchJobToken(token, secret)).toEqual(job);
  });

  it("rejects tampering and context substitution", () => {
    const digest = researchContextDigest(request);
    const token = sealResearchJobToken(
      {
        responseId: "resp_background_test",
        contextDigest: digest,
        dateChecked: "2026-07-16",
        createdAt: 1_752_643_200_000,
        cancelRequested: false,
      },
      secret,
    );
    const tokenParts = token.split(".");
    const firstEncryptedCharacter = tokenParts[2][0] === "a" ? "b" : "a";
    tokenParts[2] = `${firstEncryptedCharacter}${tokenParts[2].slice(1)}`;

    expect(openResearchJobToken(tokenParts.join("."), secret)).toBeNull();
    expect(
      researchContextMatches(
        digest,
        researchContextDigest({ ...request, question: "A different valid question" }),
      ),
    ).toBe(false);
  });
});
