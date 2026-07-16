import type { ProfilePatch } from "@/lib/schemas";

/** Valid ProfilePatch fixture covering every operation in the SPEC contract. */
export const VALID_PROFILE_PATCH_FIXTURE: ProfilePatch = {
  removeInferenceIds: ["inference-collaboration"],
  replaceStatements: [
    {
      targetId: "inference-visual-thinking",
      newStatement: "Visual communication may be worth exploring in future work.",
    },
  ],
  addConstraints: [
    {
      id: "constraint-schedule",
      type: "family",
      statement: "Needs a schedule compatible with family responsibilities.",
      priority: "high",
    },
  ],
  addFacts: [
    {
      id: "fact-club",
      statement: "The student helps lead a school media club.",
      sourceAnswerIds: ["activities"],
    },
  ],
};
