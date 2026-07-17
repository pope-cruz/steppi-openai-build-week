import { describe, expect, it } from "vitest";

import {
  ConversationPatchError,
  ConversationTurnPatchSchema,
  EMPTY_CONVERSATION_STATE,
  applyConversationPatch,
  fallbackConversationQuestion,
  questionFromPatch,
  type ConversationState,
  type ConversationTurn,
  type ConversationTurnPatch,
} from "@/lib/intake-conversation";

const turn: ConversationTurn = {
  id: "starting-point",
  acknowledgement: null,
  question: "What are you trying to figure out?",
  answer:
    "I am in Grade 11, coordinated a digital art project, and need affordable options near Manila, but I am unsure about coding.",
  answeredAt: "2026-07-17T02:00:00.000Z",
};

function emptyUpdates(): ConversationTurnPatch["updates"] {
  return {
    suppliedFacts: [],
    interpretedInterests: [],
    experiences: [],
    preferences: [],
    dislikes: [],
    constraints: [],
    consideredPaths: [],
    uncertainty: [],
  };
}

function patch(
  overrides: Partial<ConversationTurnPatch> = {},
): ConversationTurnPatch {
  return {
    updates: emptyUpdates(),
    supersedeItemIds: [],
    unresolvedDimensions: ["strengths-and-preferences"],
    enoughContext: false,
    acknowledgement: "You mentioned coordinating a digital art project.",
    nextQuestion: "Which part of that project held your attention most?",
    ...overrides,
  };
}

describe("conversational state patches", () => {
  it("applies a rich broad answer and yields a personalized follow-up", () => {
    const richPatch = patch({
      updates: {
        ...emptyUpdates(),
        suppliedFacts: [
          {
            id: "grade-11",
            text: "The student is in Grade 11.",
            basis: "explicit",
            sourceTurnIds: [turn.id],
          },
        ],
        interpretedInterests: [
          {
            id: "creative-tech",
            text: "Creative technology may interest the student.",
            basis: "tentative-interpretation",
            sourceTurnIds: [turn.id],
          },
        ],
        experiences: [
          {
            id: "digital-art-project",
            text: "The student coordinated a digital art project.",
            basis: "explicit",
            sourceTurnIds: [turn.id],
          },
        ],
        constraints: [
          {
            id: "affordable-manila",
            text: "Affordable options near Manila matter.",
            basis: "explicit",
            sourceTurnIds: [turn.id],
          },
        ],
        uncertainty: [
          {
            id: "coding-uncertainty",
            text: "The student is unsure how much coding they would enjoy.",
            basis: "explicit",
            sourceTurnIds: [turn.id],
          },
        ],
      },
    });
    const state = applyConversationPatch(
      EMPTY_CONVERSATION_STATE,
      richPatch,
      [turn],
    );

    expect(state.suppliedFacts).toHaveLength(1);
    expect(state.experiences[0].text).toContain("digital art");
    expect(state.uncertainty).toHaveLength(1);
    expect(questionFromPatch(richPatch, 1)?.prompt).toContain("project");
  });

  it("does not require already supplied dimensions in a validated next state", () => {
    const result = applyConversationPatch(
      EMPTY_CONVERSATION_STATE,
      patch({ unresolvedDimensions: ["dislikes"] }),
      [turn],
    );
    expect(result.unresolvedDimensions).toEqual(["dislikes"]);
  });

  it("accepts explicit uncertainty without forcing completion", () => {
    const uncertain = patch({
      updates: {
        ...emptyUpdates(),
        uncertainty: [
          {
            id: "no-direction-yet",
            text: "The student does not know which directions to consider yet.",
            basis: "explicit",
            sourceTurnIds: [turn.id],
          },
        ],
      },
    });
    const result = applyConversationPatch(
      EMPTY_CONVERSATION_STATE,
      uncertain,
      [turn],
    );
    expect(result.uncertainty[0].basis).toBe("explicit");
    expect(result.enoughContext).toBe(false);
  });

  it("predictably replaces contradicted information and records supersession", () => {
    const original: ConversationState = {
      ...EMPTY_CONVERSATION_STATE,
      suppliedFacts: [
        {
          id: "grade-11",
          text: "The student is in Grade 11.",
          basis: "explicit",
          sourceTurnIds: [turn.id],
        },
      ],
      preferences: [
        {
          id: "pref-solo",
          text: "The student prefers working alone.",
          basis: "explicit",
          sourceTurnIds: [turn.id],
        },
      ],
    };
    const correctionTurn: ConversationTurn = {
      ...turn,
      id: "follow-up-2",
      answer:
        "Correction: I am in Grade 12, and I actually prefer working with a team.",
    };
    const correction = patch({
      updates: {
        ...emptyUpdates(),
        suppliedFacts: [
          {
            id: "grade-12",
            text: "The student is in Grade 12.",
            basis: "explicit",
            sourceTurnIds: [correctionTurn.id],
          },
        ],
        preferences: [
          {
            id: "pref-team",
            text: "The student prefers working with a team.",
            basis: "explicit",
            sourceTurnIds: [correctionTurn.id],
          },
        ],
      },
      supersedeItemIds: ["grade-11", "pref-solo"],
    });
    const result = applyConversationPatch(original, correction, [turn, correctionTurn]);

    expect(result.suppliedFacts.map((item) => item.id)).toEqual(["grade-12"]);
    expect(result.preferences.map((item) => item.id)).toEqual(["pref-team"]);
    expect(result.correctedOrSupersededInformation).toEqual([
      {
        itemId: "grade-11",
        text: "The student is in Grade 11.",
        supersededByTurnId: "follow-up-2",
      },
      {
        itemId: "pref-solo",
        text: "The student prefers working alone.",
        supersededByTurnId: "follow-up-2",
      },
    ]);
  });

  it("rejects unknown superseded IDs and ungrounded source-turn IDs", () => {
    expect(() =>
      applyConversationPatch(
        EMPTY_CONVERSATION_STATE,
        patch({ supersedeItemIds: ["not-active"] }),
        [turn],
      ),
    ).toThrow(ConversationPatchError);
    expect(() =>
      applyConversationPatch(
        EMPTY_CONVERSATION_STATE,
        patch({
          updates: {
            ...emptyUpdates(),
            suppliedFacts: [
              {
                id: "unlinked",
                text: "An unlinked fact.",
                basis: "explicit",
                sourceTurnIds: ["missing-turn"],
              },
            ],
          },
        }),
        [turn],
      ),
    ).toThrow(ConversationPatchError);
  });

  it("allows early completion with rich context and continued questioning after shallow turns", () => {
    const complete = patch({
      unresolvedDimensions: [],
      enoughContext: true,
      nextQuestion: null,
    });
    expect(ConversationTurnPatchSchema.safeParse(complete).success).toBe(true);
    expect(questionFromPatch(complete, 1)).toBeNull();

    const shallowTurns = Array.from({ length: 4 }, (_, index) => ({
      ...turn,
      id: `turn-${index + 1}`,
      answer: "I am not sure yet.",
    }));
    const continuing = patch({
      updates: {
        ...emptyUpdates(),
        uncertainty: [
          {
            id: "still-unsure",
            text: "The student remains unsure.",
            basis: "explicit",
            sourceTurnIds: ["turn-4"],
          },
        ],
      },
    });
    expect(
      applyConversationPatch(EMPTY_CONVERSATION_STATE, continuing, shallowTurns)
        .enoughContext,
    ).toBe(false);
    expect(questionFromPatch(continuing, 4)).not.toBeNull();
  });

  it("rejects malformed completion decisions and exposes a safe fallback", () => {
    expect(
      ConversationTurnPatchSchema.safeParse(
        patch({ enoughContext: true, nextQuestion: "One more question?" }),
      ).success,
    ).toBe(false);
    const fallback = fallbackConversationQuestion(1);
    expect(fallback.prompt).toContain("most important");
    expect(fallback.acknowledgement).not.toMatch(/schema|model|category/i);
  });
});
