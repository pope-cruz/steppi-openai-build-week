import type {
  ConversationState,
  ConversationTurn,
  ConversationTurnPatch,
  IntakeTurnApiResponse,
} from "@/lib/intake-conversation";

export type DevelopmentIntakeFixture =
  | "intake-success"
  | "intake-alternate"
  | "intake-practical"
  | "intake-uncertain"
  | "intake-max-turns"
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

function richFirstAnswerPatch(turns: ConversationTurn[]): ConversationTurnPatch {
  const latestTurn = turns.at(-1)!;

  return {
    updates: {
      ...emptyUpdates(),
      suppliedFacts: [
        {
          id: "fact-rich-grade-11",
          text: "The student is in Grade 11.",
          basis: "explicit",
          sourceTurnIds: [latestTurn.id],
        },
      ],
      interpretedInterests: [
        {
          id: "interest-rich-creative-tech",
          text: "Creative technology may be worth exploring.",
          basis: "tentative-interpretation",
          sourceTurnIds: [latestTurn.id],
        },
      ],
      experiences: [
        {
          id: "experience-rich-publication",
          text: "The student designed layouts for a school publication.",
          basis: "explicit",
          sourceTurnIds: [latestTurn.id],
        },
      ],
      preferences: [
        {
          id: "preference-rich-collaboration",
          text: "The student likes shaping ideas with a team.",
          basis: "explicit",
          sourceTurnIds: [latestTurn.id],
        },
      ],
      dislikes: [
        {
          id: "dislike-rich-routine",
          text: "The student dislikes repetitive work.",
          basis: "explicit",
          sourceTurnIds: [latestTurn.id],
        },
      ],
      constraints: [
        {
          id: "constraint-rich-manila-cost",
          text: "Affordable study near Manila matters to the student.",
          basis: "explicit",
          sourceTurnIds: [latestTurn.id],
        },
      ],
      consideredPaths: [
        {
          id: "path-rich-design-or-computing",
          text: "The student has considered design and computing but is unsure between them.",
          basis: "explicit",
          sourceTurnIds: [latestTurn.id],
        },
      ],
      uncertainty: [
        {
          id: "uncertainty-rich-coding",
          text: "The student is unsure how much coding they would enjoy.",
          basis: "explicit",
          sourceTurnIds: [latestTurn.id],
        },
      ],
    },
    supersedeItemIds: [],
    unresolvedDimensions: ["certainty-and-help-goal"],
    enoughContext: true,
    acknowledgement:
      "You connected a real creative project with the kind of work and practical limits that matter to you.",
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
      "In that cleanup, what held your attention most—and would you rather investigate the problem, organize people, or work hands-on next time?",
  };
}

function practicalPatch(turns: ConversationTurn[]): ConversationTurnPatch {
  const latestTurn = turns.at(-1)!;

  if (turns.length === 1) {
    return {
      updates: {
        ...emptyUpdates(),
        experiences: [
          {
            id: "experience-practical-publication",
            text: "The student contributed visual work to a school publication.",
            basis: "explicit",
            sourceTurnIds: [latestTurn.id],
          },
        ],
        constraints: [
          {
            id: "constraint-practical-affordability",
            text: "Keeping study costs manageable matters to the student.",
            basis: "explicit",
            sourceTurnIds: [latestTurn.id],
          },
          {
            id: "constraint-practical-manila",
            text: "The student needs options in or near Manila.",
            basis: "explicit",
            sourceTurnIds: [latestTurn.id],
          },
          {
            id: "constraint-practical-family",
            text: "The student's family hopes they will choose a stable direction.",
            basis: "explicit",
            sourceTurnIds: [latestTurn.id],
          },
          {
            id: "constraint-practical-transport",
            text: "A long daily commute would be difficult for the student.",
            basis: "explicit",
            sourceTurnIds: [latestTurn.id],
          },
        ],
      },
      supersedeItemIds: [],
      unresolvedDimensions: [
        "interests",
        "strengths-and-preferences",
        "dislikes",
      ],
      enoughContext: false,
      acknowledgement:
        "You want to build from your publication experience while keeping Manila, cost, family expectations, and travel realistic.",
      nextQuestion:
        "When you worked on the publication, which part gave you energy—making the visuals, shaping the message with others, or solving production problems—and what drained you?",
    };
  }

  return {
    updates: {
      ...emptyUpdates(),
      preferences: [
        {
          id: "preference-practical-visual-collaboration",
          text: "The student enjoys collaborative visual work.",
          basis: "explicit",
          sourceTurnIds: [latestTurn.id],
        },
      ],
      dislikes: [
        {
          id: "dislike-practical-production-rush",
          text: "The student dislikes rushed production work.",
          basis: "explicit",
          sourceTurnIds: [latestTurn.id],
        },
      ],
    },
    supersedeItemIds: [],
    unresolvedDimensions: [],
    enoughContext: true,
    acknowledgement:
      "That gives Steppi both the work pattern you enjoy and the practical boundaries an initial profile should respect.",
    nextQuestion: null,
  };
}

function uncertainPatch(turns: ConversationTurn[]): ConversationTurnPatch {
  const latestTurn = turns.at(-1)!;
  const followUps = [
    "Is there a class, activity, or problem you have enjoyed even a little lately?",
    "What kind of school task is easiest for you to stay with: making something, explaining an idea, helping someone, or figuring out how something works?",
    "Would trying something with people, ideas, technology, or hands-on materials feel least unfamiliar right now?",
    "Is there any kind of task you already know you would rather avoid?",
    "Have you tried anything outside class—even briefly—that you would or would not do again?",
    "What kind of support helps you try something new: clear instructions, a teammate, practice time, or seeing an example first?",
    "Are there any practical limits Steppi should respect, such as location, cost, travel, access, or family expectations—or none you know of yet?",
    "Has anyone in your family suggested a direction, and how do you feel about that suggestion?",
    "Which subject feels most manageable right now, even if it is not a favorite?",
    "What is one small project or experience you might be willing to try before choosing anything?",
    "What would be most useful for Steppi to help you compare or rule out?",
  ];

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
    acknowledgement:
      "Not having much exposure yet is useful context; Steppi can keep the next step low-pressure.",
    nextQuestion: followUps[Math.min(turns.length - 1, followUps.length - 1)],
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
    fixture === "intake-success"
      ? richFirstAnswerPatch(turns)
      : fixture === "intake-alternate"
      ? alternatePatch(turns)
      : fixture === "intake-practical"
        ? practicalPatch(turns)
        : fixture === "intake-uncertain" || fixture === "intake-max-turns"
        ? uncertainPatch(turns)
        : creativePatch(turns);

  return { ok: true, patch } satisfies IntakeTurnApiResponse;
}
