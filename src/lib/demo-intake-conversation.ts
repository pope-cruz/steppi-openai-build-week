import type {
  ConversationState,
  ConversationTurn,
  ConversationTurnPatch,
  IntakeTurnApiResponse,
} from "@/lib/intake-conversation";

export type DevelopmentIntakeFixture =
  | "intake-success"
  | "intake-alternate"
  | "intake-uncertain"
  | "intake-retry"
  | "intake-malformed";

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

function creativePatch(turns: ConversationTurn[]): ConversationTurnPatch {
  const latestTurn = turns.at(-1)!;

  if (turns.length === 1) {
    return {
      updates: {
        ...emptyUpdates(),
        suppliedFacts: [
          {
            id: "fact-grade-11",
            text: "The student is in Grade 11.",
            basis: "explicit",
            sourceTurnIds: [latestTurn.id],
          },
        ],
        interpretedInterests: [
          {
            id: "interest-creative-technology",
            text: "Creative work with digital technology may hold the student's attention.",
            basis: "tentative-interpretation",
            sourceTurnIds: [latestTurn.id],
          },
        ],
        experiences: [
          {
            id: "experience-digital-art-project",
            text: "The student coordinated a digital art project.",
            basis: "explicit",
            sourceTurnIds: [latestTurn.id],
          },
        ],
        consideredPaths: [
          {
            id: "path-computer-science",
            text: "The student has considered computer science.",
            basis: "explicit",
            sourceTurnIds: [latestTurn.id],
          },
        ],
      },
      supersedeItemIds: [],
      unresolvedDimensions: [
        "strengths-and-preferences",
        "dislikes",
        "constraints",
      ],
      enoughContext: false,
      acknowledgement:
        "You mentioned coordinating a digital art project while considering computer science.",
      nextQuestion:
        "What part of bringing that project together felt most satisfying—and what would you rather do less of?",
    };
  }

  return {
    updates: {
      ...emptyUpdates(),
      preferences: [
        {
          id: `preference-collaboration-${turns.length}`,
          text: "The student enjoys helping a group shape and present an idea.",
          basis: "explicit",
          sourceTurnIds: [latestTurn.id],
        },
      ],
      dislikes: [
        {
          id: `dislike-programming-${turns.length}`,
          text: "The student does not want programming to dominate future work.",
          basis: "explicit",
          sourceTurnIds: [latestTurn.id],
        },
      ],
      constraints: [
        {
          id: `constraint-manila-cost-${turns.length}`,
          text: "Affordable options near Manila matter to the student.",
          basis: "explicit",
          sourceTurnIds: [latestTurn.id],
        },
      ],
    },
    supersedeItemIds: [],
    unresolvedDimensions: [],
    enoughContext: true,
    acknowledgement:
      "That helps connect the kind of role you enjoy with the limits you need respected.",
    nextQuestion: null,
  };
}

function alternatePatch(turns: ConversationTurn[]): ConversationTurnPatch {
  const latestTurn = turns.at(-1)!;

  return {
    updates: {
      ...emptyUpdates(),
      suppliedFacts: [
        {
          id: "fact-grade-11-alternate",
          text: "The student is in Grade 11.",
          basis: "explicit",
          sourceTurnIds: [latestTurn.id],
        },
      ],
      interpretedInterests: [
        {
          id: "interest-environment",
          text: "Environmental science may be worth understanding more clearly.",
          basis: "tentative-interpretation",
          sourceTurnIds: [latestTurn.id],
        },
      ],
      experiences: [
        {
          id: "experience-coastal-cleanup",
          text: "The student volunteered at a coastal cleanup.",
          basis: "explicit",
          sourceTurnIds: [latestTurn.id],
        },
      ],
    },
    supersedeItemIds: [],
    unresolvedDimensions: [
      "considered-paths",
      "strengths-and-preferences",
      "constraints",
      "certainty-and-help-goal",
    ],
    enoughContext: false,
    acknowledgement:
      "You mentioned that the coastal cleanup stayed with you.",
    nextQuestion:
      "What about that experience held your attention: the science, the hands-on work, or helping the community?",
  };
}

function uncertainPatch(turns: ConversationTurn[]): ConversationTurnPatch {
  const latestTurn = turns.at(-1)!;

  return {
    updates: {
      ...emptyUpdates(),
      uncertainty: [
        {
          id: `uncertainty-starting-point-${turns.length}`,
          text: "The student is not yet sure which directions to consider.",
          basis: "explicit",
          sourceTurnIds: [latestTurn.id],
        },
      ],
    },
    supersedeItemIds: [],
    unresolvedDimensions: [
      "grade",
      "interests",
      "subjects-and-activities",
      "experiences",
      "considered-paths",
      "strengths-and-preferences",
      "dislikes",
      "constraints",
    ],
    enoughContext: false,
    acknowledgement: "Starting without a clear direction is completely okay.",
    nextQuestion:
      "Is there a class, activity, or problem you have enjoyed even a little lately?",
  };
}

export function developmentIntakeTurnPayload({
  fixture,
  state,
  turns,
  attempt,
}: {
  fixture: DevelopmentIntakeFixture;
  state: ConversationState;
  turns: ConversationTurn[];
  attempt: number;
}): unknown {
  // Exercise the complete fixture boundary without interpreting state in-browser.
  void state;
  if (fixture === "intake-malformed") {
    return { ok: true, patch: { nextQuestion: 42 } };
  }

  if (fixture === "intake-retry" && attempt === 1) {
    return {
      ok: false,
      error: {
        code: "api_failure",
        message:
          "Steppi could not interpret that answer right now. Your conversation is still here.",
        retryable: true,
      },
    } satisfies IntakeTurnApiResponse;
  }

  const patch =
    fixture === "intake-alternate"
      ? alternatePatch(turns)
      : fixture === "intake-uncertain"
        ? uncertainPatch(turns)
        : creativePatch(turns);

  return { ok: true, patch } satisfies IntakeTurnApiResponse;
}
