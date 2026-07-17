import { describe, expect, it } from "vitest";

import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

import {
  EMPTY_PROFILE_REFINEMENT_PATCH,
  PROFILE_REFINEMENT_OPENING_QUESTION,
  ProfileRefinementApplicationError,
  ProfileRefinementModelOutputSchema,
  appendProfileRefinementTurn,
  applyProfileRefinementPatch,
  buildProfileSummary,
  type ProfileRefinementTurn,
} from "./profile-refinement";

const turn: ProfileRefinementTurn = {
  id: "profile-refinement-1",
  question: PROFILE_REFINEMENT_OPENING_QUESTION,
  answer: "I like technology, but I do not want a technical career.",
  answeredAt: "2026-07-17T10:00:00+08:00",
};

describe("profile refinement", () => {
  it("builds a concise student-facing summary without internal metadata", () => {
    const summary = buildProfileSummary(VALID_PROFILE_FIXTURE);

    expect(summary.decision).toBe(
      VALID_PROFILE_FIXTURE.uncertainties[0].question,
    );
    expect(summary.signals).toContain(
      "You are interested in art, technology, and digital products.",
    );
    expect(summary.signals).toContain(
      "You do not enjoy programming-heavy work.",
    );
    expect(summary.practicalContext).toEqual([
      VALID_PROFILE_FIXTURE.constraints[0].statement,
    ]);
    expect(JSON.stringify(summary)).not.toContain("inference-collaboration");
    expect(JSON.stringify(summary)).not.toContain("confidence");
    expect(JSON.stringify(summary)).not.toContain("sourceAnswerIds");
    expect(JSON.stringify(summary)).not.toContain("The student");
  });

  it("accepts direct completion and contextual follow-up model outcomes", () => {
    expect(
      ProfileRefinementModelOutputSchema.safeParse({
        patch: EMPTY_PROFILE_REFINEMENT_PATCH,
        acknowledgement: "That distinction matters.",
        decision: "complete",
        nextQuestion: null,
      }).success,
    ).toBe(true);
    expect(
      ProfileRefinementModelOutputSchema.safeParse({
        patch: EMPTY_PROFILE_REFINEMENT_PATCH,
        acknowledgement: "Cost and location both matter here.",
        decision: "follow_up",
        nextQuestion: "Which one should shape the paths more?",
      }).success,
    ).toBe(true);
    expect(
      ProfileRefinementModelOutputSchema.safeParse({
        patch: EMPTY_PROFILE_REFINEMENT_PATCH,
        acknowledgement: "I heard that.",
        decision: "complete",
        nextQuestion: "An unnecessary extra question?",
      }).success,
    ).toBe(false);
  });

  it("corrects a tentative interpretation and preserves every unaffected item", () => {
    const original = structuredClone(VALID_PROFILE_FIXTURE);
    const snapshot = structuredClone(original);
    const result = applyProfileRefinementPatch(
      original,
      {
        ...EMPTY_PROFILE_REFINEMENT_PATCH,
        replaceInferences: [
          {
            targetId: "inference-collaboration",
            statement:
              "Technology may be a useful tool without becoming the focus of the student's work.",
            rationale: "The student directly corrected the earlier interpretation.",
            confidence: "high",
          },
        ],
        addConstraints: [
          {
            id: "constraint-nontechnical",
            type: "preference",
            statement: "Avoid technical or programming-heavy careers.",
            priority: "high",
          },
        ],
      },
      [turn],
    );

    expect(result.inferences[0].statement).toContain("useful tool");
    expect(result.inferences[1]).toEqual(snapshot.inferences[1]);
    expect(result.constraints).toHaveLength(2);
    expect(result.facts).toEqual(snapshot.facts);
    expect(result.uncertainties).toEqual(snapshot.uncertainties);
    expect(result.tensions).toEqual(snapshot.tensions);
    expect(original).toEqual(snapshot);
  });

  it("changes a constraint's importance without adding a duplicate", () => {
    const result = applyProfileRefinementPatch(
      VALID_PROFILE_FIXTURE,
      {
        ...EMPTY_PROFILE_REFINEMENT_PATCH,
        replaceConstraints: [
          {
            targetId: "constraint-location",
            type: "geographic",
            statement: "Staying near Manila is non-negotiable.",
            priority: "high",
          },
        ],
      },
      [turn],
    );

    expect(result.constraints).toHaveLength(1);
    expect(result.constraints[0]).toMatchObject({
      id: "constraint-location",
      statement: "Staying near Manila is non-negotiable.",
      priority: "high",
    });
  });

  it("preserves uncertainty when the student does not resolve it", () => {
    const result = applyProfileRefinementPatch(
      VALID_PROFILE_FIXTURE,
      EMPTY_PROFILE_REFINEMENT_PATCH,
      [
        {
          ...turn,
          answer: "I still don't know which kind of coursework I would enjoy.",
        },
      ],
    );

    expect(result.uncertainties).toEqual(VALID_PROFILE_FIXTURE.uncertainties);
  });

  it("requires corrected and added facts to cite a refinement answer", () => {
    expect(() =>
      applyProfileRefinementPatch(
        VALID_PROFILE_FIXTURE,
        {
          ...EMPTY_PROFILE_REFINEMENT_PATCH,
          replaceFacts: [
            {
              targetId: "fact-programming",
              statement: "The student enjoys small coding experiments.",
              sourceAnswerIds: ["dislikes"],
            },
          ],
        },
        [turn],
      ),
    ).toThrow(ProfileRefinementApplicationError);

    const result = applyProfileRefinementPatch(
      VALID_PROFILE_FIXTURE,
      {
        ...EMPTY_PROFILE_REFINEMENT_PATCH,
        replaceFacts: [
          {
            targetId: "fact-programming",
            statement: "The student enjoys small coding experiments.",
            sourceAnswerIds: [turn.id],
          },
        ],
      },
      [turn],
    );
    expect(result.facts[1].sourceAnswerIds).toEqual([turn.id]);
  });

  it("rejects an invalid patch atomically", () => {
    const original = structuredClone(VALID_PROFILE_FIXTURE);
    expect(() =>
      applyProfileRefinementPatch(
        original,
        {
          ...EMPTY_PROFILE_REFINEMENT_PATCH,
          removeInferenceIds: ["missing-inference"],
        },
        [turn],
      ),
    ).toThrow(ProfileRefinementApplicationError);
    expect(original).toEqual(VALID_PROFILE_FIXTURE);
  });

  it("appends one answer and prevents a duplicate turn identifier", () => {
    const first = appendProfileRefinementTurn(
      [],
      PROFILE_REFINEMENT_OPENING_QUESTION,
      "  I want cost to matter more.  ",
      "2026-07-17T10:00:00+08:00",
    );
    const duplicateSource = [{ ...first[0], id: "profile-refinement-2" }];
    const duplicate = appendProfileRefinementTurn(
      duplicateSource,
      "Another question",
      "Another answer",
      "2026-07-17T10:01:00+08:00",
    );

    expect(first[0].answer).toBe("I want cost to matter more.");
    expect(duplicate).toBe(duplicateSource);
    expect(() =>
      appendProfileRefinementTurn(
        [],
        PROFILE_REFINEMENT_OPENING_QUESTION,
        " ",
        "2026-07-17T10:00:00+08:00",
      ),
    ).toThrow();
  });
});
