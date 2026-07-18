import { describe, expect, it } from "vitest";

import {
  EMPTY_CONVERSATION_STATE,
  FINAL_CONSIDERATION_QUESTION,
  applyConversationPatch,
  firstConversationQuestion,
  hasMultipleIndependentQuestions,
  isFinalDeclineAnswer,
  isProhibitedGenericQuestion,
  nextControllerQuestion,
  prepareConversationPatchForController,
  questionAfterInterpretationFailure,
  type ConversationQuestion,
  type ConversationState,
  type ConversationTurn,
  type ConversationTurnPatch,
  type FollowUpCandidate,
} from "@/lib/intake-conversation";

const answeredAt = "2026-07-17T02:00:00.000Z";

function turn(
  question: ConversationQuestion,
  answer = "A detailed answer.",
): ConversationTurn {
  return {
    id: question.id,
    stage: question.stage,
    purpose: question.purpose,
    acknowledgement: question.acknowledgement,
    question: question.prompt,
    answer,
    answeredAt,
  };
}

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
  values: Partial<ConversationTurnPatch> = {},
): ConversationTurnPatch {
  return {
    updates: emptyUpdates(),
    supersedeItemIds: [],
    unresolvedDimensions: [],
    acknowledgement: "You gave a concrete example.",
    followUpCandidates: [],
    ...values,
  };
}

function candidate(
  values: Partial<FollowUpCandidate> & Pick<FollowUpCandidate, "purpose">,
): FollowUpCandidate {
  return {
    rationale: "This would materially sharpen the directions.",
    targetItemIds: [],
    targetDimensions: [],
    sourceTurnIds: ["anchor-outside"],
    question: "Which part would you want a future path to include?",
    ...values,
  };
}

const stateWithDirections: ConversationState = {
  ...EMPTY_CONVERSATION_STATE,
  consideredPaths: [
    {
      id: "path-design",
      text: "The student is considering design.",
      basis: "explicit",
      sourceTurnIds: ["anchor-existing"],
    },
    {
      id: "path-computing",
      text: "The student is considering computing.",
      basis: "explicit",
      sourceTurnIds: ["anchor-existing"],
    },
  ],
  constraints: [
    {
      id: "constraint-cost",
      text: "Cost may limit the student's options.",
      basis: "tentative-interpretation",
      sourceTurnIds: ["anchor-outside"],
    },
  ],
};

describe("deterministic intake controller", () => {
  it("always presents all three anchors in the required order", () => {
    const first = firstConversationQuestion();
    const firstTurn = turn(
      first,
      "I already covered my school and outside-school experiences too.",
    );
    const second = nextControllerQuestion({
      completedTurn: firstTurn,
      patch: patch(),
      turns: [firstTurn],
    });
    expect(first.stage).toBe("anchor-existing");
    expect(second?.stage).toBe("anchor-school");

    const secondTurn = turn(second!);
    const third = nextControllerQuestion({
      completedTurn: secondTurn,
      patch: patch(),
      turns: [firstTurn, secondTurn],
    });
    expect(third?.stage).toBe("anchor-outside");
  });

  it("selects follow-ups using the fixed controller priority", () => {
    const outsideQuestion: ConversationQuestion = {
      id: "anchor-outside",
      stage: "anchor-outside",
      purpose: null,
      acknowledgement: null,
      prompt: "Outside-school experiences?",
      helper: "",
      placeholder: "",
    };
    const outsideTurn = turn(outsideQuestion);
    const prepared = prepareConversationPatchForController(
      stateWithDirections,
      patch({
        unresolvedDimensions: [
          "considered-paths",
          "constraints",
          "experiences",
        ],
        followUpCandidates: [
          candidate({
            purpose: "material-evidence-gap",
            targetDimensions: ["experiences"],
            question: "Which experience would you most want to repeat?",
          }),
          candidate({
            purpose: "clarify-practical-constraint",
            targetItemIds: ["constraint-cost"],
            targetDimensions: ["constraints"],
            question: "How would cost change what you can explore first?",
          }),
          candidate({
            purpose: "distinguish-directions",
            targetItemIds: ["path-design", "path-computing"],
            question: "Which difference between design and computing matters most?",
          }),
          candidate({
            purpose: "resolve-contradiction",
            targetItemIds: ["path-design", "path-computing"],
            question: "You described both paths differently; which account is closer?",
          }),
        ],
      }),
      [outsideTurn],
    );

    const next = nextControllerQuestion({
      completedTurn: outsideTurn,
      patch: prepared,
      turns: [outsideTurn],
    });
    expect(next).toMatchObject({
      stage: "follow-up-1",
      purpose: "resolve-contradiction",
    });
  });

  it("asks a second follow-up only for a distinct remaining purpose", () => {
    const firstFollowUp: ConversationQuestion = {
      id: "follow-up-1",
      stage: "follow-up-1",
      purpose: "distinguish-directions",
      acknowledgement: null,
      prompt: "Which direction difference matters most?",
      helper: "",
      placeholder: "",
    };
    const firstTurn = turn(firstFollowUp);
    const distinctPatch = patch({
      unresolvedDimensions: ["constraints"],
      followUpCandidates: [
        candidate({
          purpose: "distinguish-directions",
          sourceTurnIds: ["follow-up-1"],
          targetItemIds: ["path-design", "path-computing"],
        }),
        candidate({
          purpose: "clarify-practical-constraint",
          sourceTurnIds: ["follow-up-1"],
          targetItemIds: ["constraint-cost"],
          targetDimensions: ["constraints"],
          question: "How would cost change which path you explore first?",
        }),
      ],
    });
    const prepared = prepareConversationPatchForController(
      stateWithDirections,
      distinctPatch,
      [firstTurn],
    );
    expect(
      nextControllerQuestion({
        completedTurn: firstTurn,
        patch: prepared,
        turns: [firstTurn],
      }),
    ).toMatchObject({
      stage: "follow-up-2",
      purpose: "clarify-practical-constraint",
    });

    expect(
      nextControllerQuestion({
        completedTurn: firstTurn,
        patch: patch(),
        turns: [firstTurn],
      }),
    ).toEqual({
      ...FINAL_CONSIDERATION_QUESTION,
      acknowledgement: "You gave a concrete example.",
    });
  });

  it("uses the exact stable final question and never asks after it", () => {
    expect(FINAL_CONSIDERATION_QUESTION).toMatchObject({
      id: "final-consideration",
      stage: "final",
      prompt: "Before I put this together, is there anything else Steppi should consider?",
    });
    const finalTurn = turn(FINAL_CONSIDERATION_QUESTION, "Nothing");
    expect(
      nextControllerQuestion({
        completedTurn: finalTurn,
        patch: patch(),
        turns: [finalTurn],
      }),
    ).toBeNull();
  });

  it("advances deterministically after interpretation failures", () => {
    const anchor1 = turn(firstConversationQuestion());
    expect(questionAfterInterpretationFailure(anchor1)?.stage).toBe(
      "anchor-school",
    );
    const anchor2Question = nextControllerQuestion({
      completedTurn: anchor1,
      patch: patch(),
      turns: [anchor1],
    })!;
    const anchor2 = turn(anchor2Question);
    expect(questionAfterInterpretationFailure(anchor2)?.stage).toBe(
      "anchor-outside",
    );
    const anchor3Question = nextControllerQuestion({
      completedTurn: anchor2,
      patch: patch(),
      turns: [anchor1, anchor2],
    })!;
    const anchor3 = turn(anchor3Question);
    expect(questionAfterInterpretationFailure(anchor3)).toMatchObject({
      stage: "follow-up-1",
      purpose: "distinguish-directions",
    });
    const followUp = turn(questionAfterInterpretationFailure(anchor3)!);
    expect(questionAfterInterpretationFailure(followUp)?.stage).toBe("final");
    expect(
      questionAfterInterpretationFailure(turn(FINAL_CONSIDERATION_QUESTION)),
    ).toBeNull();
  });
});

describe("intake interpretation validation", () => {
  it("applies validated updates and preserves source-turn references", () => {
    const firstTurn = turn(firstConversationQuestion());
    const result = applyConversationPatch(
      EMPTY_CONVERSATION_STATE,
      patch({
        updates: {
          ...emptyUpdates(),
          consideredPaths: [
            {
              id: "path-design",
              text: "The student is considering design.",
              basis: "explicit",
              sourceTurnIds: [firstTurn.id],
            },
          ],
        },
      }),
      [firstTurn],
    );
    expect(result.consideredPaths[0]?.sourceTurnIds).toEqual([firstTurn.id]);
  });

  it("rejects invalid update references but drops invalid candidates", () => {
    const outsideTurn: ConversationTurn = {
      ...turn(firstConversationQuestion()),
      id: "anchor-outside",
      stage: "anchor-outside",
      question: "Outside experiences?",
    };
    expect(() =>
      applyConversationPatch(
        EMPTY_CONVERSATION_STATE,
        patch({
          updates: {
            ...emptyUpdates(),
            experiences: [
              {
                id: "invalid",
                text: "Invalid source.",
                basis: "explicit",
                sourceTurnIds: ["missing-turn"],
              },
            ],
          },
        }),
        [outsideTurn],
      ),
    ).toThrow("invalid_conversation_patch");

    const prepared = prepareConversationPatchForController(
      stateWithDirections,
      patch({
        followUpCandidates: [
          candidate({
            purpose: "distinguish-directions",
            sourceTurnIds: ["missing-turn"],
            targetItemIds: ["path-design", "path-computing"],
          }),
        ],
      }),
      [outsideTurn],
    );
    expect(prepared.followUpCandidates).toEqual([]);
  });

  it("drops generic acknowledgements without losing the patch", () => {
    const firstTurn = turn(firstConversationQuestion());
    const prepared = prepareConversationPatchForController(
      EMPTY_CONVERSATION_STATE,
      patch({ acknowledgement: "Thanks for sharing" }),
      [firstTurn],
    );
    expect(prepared.acknowledgement).toBeNull();
  });

  it.each([
    "What are your strengths?",
    "Tell me your strengths.",
    "Can you tell me what your biggest strengths are?",
    "What are your weaknesses?",
    "Describe your weaknesses.",
    "Which are your main weaknesses?",
    "What kind of person are you?",
    "Describe what kind of person you are.",
    "Do you prefer working alone or with others?",
    "Would you prefer to work alone or with others?",
    "Where do you see yourself in five years?",
    "Where do you see yourself in 5 years' time?",
  ])("explicitly rejects the generic pattern: %s", (question) => {
    expect(isProhibitedGenericQuestion(question)).toBe(true);
  });

  it("does not ask about a practical constraint already marked resolved", () => {
    const outsideTurn: ConversationTurn = {
      ...turn(firstConversationQuestion()),
      id: "anchor-outside",
      stage: "anchor-outside",
    };
    const prepared = prepareConversationPatchForController(
      stateWithDirections,
      patch({
        unresolvedDimensions: [],
        followUpCandidates: [
          candidate({
            purpose: "clarify-practical-constraint",
            targetItemIds: ["constraint-cost"],
            targetDimensions: ["constraints"],
            question: "How would cost change what you can explore first?",
          }),
        ],
      }),
      [outsideTurn],
    );

    expect(prepared.followUpCandidates).toEqual([]);
  });

  it("does not distinguish directions already marked sufficiently resolved", () => {
    const outsideTurn: ConversationTurn = {
      ...turn(firstConversationQuestion()),
      id: "anchor-outside",
      stage: "anchor-outside",
    };
    const prepared = prepareConversationPatchForController(
      stateWithDirections,
      patch({
        unresolvedDimensions: ["constraints"],
        followUpCandidates: [
          candidate({
            purpose: "distinguish-directions",
            targetItemIds: ["path-design", "path-computing"],
            question: "Which difference between design and computing matters most?",
          }),
        ],
      }),
      [outsideTurn],
    );

    expect(prepared.followUpCandidates).toEqual([]);
  });

  it("rejects independent questions but allows a focused contrast", () => {
    expect(
      hasMultipleIndependentQuestions(
        "What class do you like, and where would you want to study?",
      ),
    ).toBe(true);
    expect(
      hasMultipleIndependentQuestions(
        "Which parts do you enjoy and which do you avoid?",
      ),
    ).toBe(false);
    expect(
      hasMultipleIndependentQuestions(
        "What would you include and what would you exclude?",
      ),
    ).toBe(false);
  });

  it("recognizes only the required normalized final-decline variants", () => {
    expect(isFinalDeclineAnswer(" NO. ")).toBe(true);
    expect(isFinalDeclineAnswer("nothing")).toBe(true);
    expect(isFinalDeclineAnswer("Nothing else")).toBe(true);
    expect(isFinalDeclineAnswer("I don’t know")).toBe(true);
    expect(isFinalDeclineAnswer("I have one more constraint")).toBe(false);
  });
});
