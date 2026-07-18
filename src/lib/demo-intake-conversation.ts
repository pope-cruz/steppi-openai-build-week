import type {
  ConversationState,
  ConversationTurn,
  ConversationTurnPatch,
  FollowUpCandidate,
  IntakeTurnApiResponse,
} from "@/lib/intake-conversation";

export type DevelopmentIntakeFixture =
  | "intake-success"
  | "intake-alternate"
  | "intake-practical"
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

function basePatch(
  acknowledgement: string | null,
  unresolvedDimensions: ConversationTurnPatch["unresolvedDimensions"],
): ConversationTurnPatch {
  return {
    updates: emptyUpdates(),
    supersedeItemIds: [],
    unresolvedDimensions,
    acknowledgement,
    followUpCandidates: [],
  };
}

function candidate(
  values: Pick<
    FollowUpCandidate,
    "purpose" | "question" | "targetItemIds" | "targetDimensions"
  >,
  turn: ConversationTurn,
): FollowUpCandidate {
  return {
    ...values,
    rationale: "This answer could materially sharpen the initial directions.",
    sourceTurnIds: [turn.id],
  };
}

function successPatch(
  state: ConversationState,
  turns: ConversationTurn[],
): ConversationTurnPatch {
  void state;
  const latest = turns.at(-1)!;

  if (latest.stage === "anchor-existing") {
    const patch = basePatch(
      "You are weighing design and computing for different reasons.",
      ["subjects-and-activities", "experiences", "constraints"],
    );
    patch.updates.consideredPaths = [
      {
        id: "path-design",
        text: "The student has considered design.",
        basis: "explicit",
        sourceTurnIds: [latest.id],
      },
      {
        id: "path-computing",
        text: "The student has considered computing.",
        basis: "explicit",
        sourceTurnIds: [latest.id],
      },
    ];
    return patch;
  }

  if (latest.stage === "anchor-school") {
    const patch = basePatch(
      "The publication work gives a concrete example of what holds your attention.",
      ["experiences", "constraints"],
    );
    patch.updates.experiences = [
      {
        id: "experience-publication",
        text: "The student designed and organized a school publication.",
        basis: "explicit",
        sourceTurnIds: [latest.id],
      },
    ];
    patch.updates.preferences = [
      {
        id: "preference-visual-organization",
        text: "The student enjoys visual organization.",
        basis: "explicit",
        sourceTurnIds: [latest.id],
      },
    ];
    return patch;
  }

  if (latest.stage === "anchor-outside") {
    const patch = basePatch(
      "Your personal projects add another example of making ideas visible.",
      ["considered-paths", "constraints"],
    );
    patch.updates.experiences = [
      {
        id: "experience-personal-posters",
        text: "The student makes posters for community activities.",
        basis: "explicit",
        sourceTurnIds: [latest.id],
      },
    ];
    patch.followUpCandidates = [
      candidate(
        {
          purpose: "distinguish-directions",
          question:
            "Between shaping how something looks and figuring out how it works, which would you want to spend more time doing?",
          targetItemIds: ["path-design", "path-computing"],
          targetDimensions: [],
        },
        latest,
      ),
    ];
    return patch;
  }

  if (latest.stage === "follow-up-1") {
    const patch = basePatch(
      "That contrast makes the difference between those possibilities clearer.",
      [],
    );
    patch.updates.preferences = [
      {
        id: "preference-design-over-systems",
        text: "The student prefers shaping visible experiences over technical systems.",
        basis: "explicit",
        sourceTurnIds: [latest.id],
      },
    ];
    return patch;
  }

  return basePatch(null, []);
}

function alternatePatch(
  state: ConversationState,
  turns: ConversationTurn[],
): ConversationTurnPatch {
  const latest = turns.at(-1)!;
  const patch = successPatch(state, turns);

  if (latest.stage === "follow-up-1") {
    patch.unresolvedDimensions = ["constraints"];
    patch.followUpCandidates = [
      candidate(
        {
          purpose: "clarify-practical-constraint",
          question:
            "Would cost, location, travel, access, or a family expectation materially limit which option you could explore first?",
          targetItemIds: [],
          targetDimensions: ["constraints"],
        },
        latest,
      ),
    ];
  }
  return patch;
}

function practicalPatch(
  state: ConversationState,
  turns: ConversationTurn[],
): ConversationTurnPatch {
  const latest = turns.at(-1)!;
  const patch = successPatch(state, turns);

  if (latest.stage === "anchor-outside") {
    patch.unresolvedDimensions = ["constraints"];
    patch.followUpCandidates = [
      candidate(
        {
          purpose: "clarify-practical-constraint",
          question:
            "Which practical limit would change your options most right now: cost, location, travel, access, or a family expectation?",
          targetItemIds: [],
          targetDimensions: ["constraints"],
        },
        latest,
      ),
    ];
  }
  return patch;
}

function uncertainPatch(turns: ConversationTurn[]): ConversationTurnPatch {
  const latest = turns.at(-1)!;
  const patch = basePatch(
    "Not knowing yet is useful context, and it does not stop the conversation.",
    ["interests", "certainty-and-help-goal"],
  );
  patch.updates.uncertainty = [
    {
      id: `uncertainty-${latest.id}`,
      text: "The student is still uncertain and has limited exposure.",
      basis: "explicit",
      sourceTurnIds: [latest.id],
    },
  ];
  if (latest.stage === "anchor-outside") {
    patch.followUpCandidates = [
      candidate(
        {
          purpose: "material-evidence-gap",
          question:
            "Of the experiences you have tried, which would you be most willing to repeat and which would you avoid?",
          targetItemIds: [],
          targetDimensions: ["interests"],
        },
        latest,
      ),
    ];
  }
  return patch;
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
  if (fixture === "intake-malformed") {
    return { ok: true, patch: { followUpCandidates: 42 } };
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
      ? alternatePatch(state, turns)
      : fixture === "intake-practical"
        ? practicalPatch(state, turns)
        : fixture === "intake-uncertain"
          ? uncertainPatch(turns)
          : successPatch(state, turns);

  return { ok: true, patch } satisfies IntakeTurnApiResponse;
}
