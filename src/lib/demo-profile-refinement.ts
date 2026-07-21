import type { ProfileRefinementApiResponse } from "@/lib/profile-refinement-api";
import {
  EMPTY_PROFILE_REFINEMENT_PATCH,
  applyProfileRefinementPatch,
  type ProfileRefinementRequest,
} from "@/lib/profile-refinement";

export type DevelopmentProfileRefinementFixture =
  | "direct"
  | "follow-up"
  | "several"
  | "failure"
  | "malformed";

function directCorrection(request: ProfileRefinementRequest) {
  const latestTurn = request.turns.at(-1);
  if (!latestTurn) {
    return request.profile;
  }

  return applyProfileRefinementPatch(
    request.profile,
    {
      ...EMPTY_PROFILE_REFINEMENT_PATCH,
      replaceInferences: request.profile.inferences.some(
        (inference) => inference.id === "inference-collaboration",
      )
        ? [
            {
              targetId: "inference-collaboration",
              statement:
                "Technology may be useful as a tool, but a technical career is not the student's goal.",
              rationale:
                "The student directly clarified the difference between enjoying technology and wanting technical work.",
              confidence: "high" as const,
            },
          ]
        : [],
      addConstraints: request.profile.constraints.some(
        (constraint) => constraint.id === "constraint-nontechnical-work",
      )
        ? []
        : [
            {
              id: "constraint-nontechnical-work",
              type: "preference" as const,
              statement: "Avoid paths centered on technical or programming-heavy work.",
              priority: "high" as const,
            },
          ],
    },
    request.turns,
  );
}

function prioritizeLocation(request: ProfileRefinementRequest) {
  const current = request.profile.constraints.find(
    (constraint) => constraint.id === "constraint-location",
  );
  if (!current) {
    return request.profile;
  }

  return applyProfileRefinementPatch(
    request.profile,
    {
      ...EMPTY_PROFILE_REFINEMENT_PATCH,
      replaceConstraints: [
        {
          targetId: current.id,
          type: current.type,
          statement:
            "Staying near Manila is important because commuting and family time should remain manageable.",
          priority: "high",
        },
      ],
    },
    request.turns,
  );
}

export function developmentProfileRefinementPayload(
  fixture: DevelopmentProfileRefinementFixture,
  request: ProfileRefinementRequest,
  attempt: number,
): unknown {
  if (fixture === "failure" && attempt === 1) {
    return {
      ok: false,
      error: {
        code: "api_failure",
        message:
          "Steppi could not revise this reflection right now. Your current wording is unchanged; please try again.",
        retryable: true,
      },
    } satisfies ProfileRefinementApiResponse;
  }

  if (fixture === "malformed" && attempt === 1) {
    return {
      ok: true,
      profile: { facts: [] },
      acknowledgement: "I heard that correction.",
      decision: "complete",
      nextQuestion: null,
    };
  }

  if (fixture === "follow-up" && request.turns.length === 1) {
    return {
      ok: true,
      profile: prioritizeLocation(request),
      acknowledgement:
        "Staying near Manila sounds important because it affects both travel and family time.",
      decision: "follow_up",
      nextQuestion:
        "Would you trade a longer commute for a much more affordable option, or should nearby options come first?",
    } satisfies ProfileRefinementApiResponse;
  }

  if (fixture === "several" && request.turns.length < 3) {
    const questions = [
      "When cost and creative freedom pull in different directions, which should shape the paths more?",
      "Would you rather see safer familiar options, or one possibility that feels genuinely new?",
    ];
    return {
      ok: true,
      profile:
        request.turns.length === 1 ? prioritizeLocation(request) : request.profile,
      acknowledgement:
        request.turns.length === 1
          ? "That makes location a real boundary, not just a preference."
          : "That tradeoff helps Steppi decide how varied the role possibilities should feel.",
      decision: "follow_up",
      nextQuestion: questions[request.turns.length - 1],
    } satisfies ProfileRefinementApiResponse;
  }

  return {
    ok: true,
    profile:
      fixture === "follow-up" || fixture === "several"
        ? request.profile
        : directCorrection(request),
    acknowledgement:
      fixture === "follow-up" || fixture === "several"
        ? "That is enough to shape the map without pretending the uncertainty is resolved."
        : "That correction changes how Steppi should interpret your interest in technology.",
    decision: request.turns.length > 1 ? "offer_choice" : "complete",
    nextQuestion: null,
  } satisfies ProfileRefinementApiResponse;
}
