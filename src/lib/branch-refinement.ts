import { z } from "zod";

import {
  PathBranchSchema,
  ResearchNodeSchema,
  ResearchRequestSchema,
  StudentProfileSchema,
  type ResearchRequest,
} from "@/lib/schemas";

export const BRANCH_REFINEMENT_CONSTRAINT =
  "Prioritize affordable options near Manila" as const;

export const BranchResearchSnapshotSchema = z
  .object({
    branchId: z.string().trim().min(1).max(80),
    question: z.string().trim().min(6).max(300),
    nodes: z.array(ResearchNodeSchema).min(1).max(5),
  })
  .strict()
  .superRefine(({ branchId, nodes }, context) => {
    if (nodes.some((node) => node.parentBranchId !== branchId)) {
      context.addIssue({
        code: "custom",
        message: "Every research node must belong to the snapshot branch.",
        path: ["nodes"],
      });
    }
  });

export const BranchRefinementRequestSchema = z
  .object({
    profile: StudentProfileSchema,
    branch: PathBranchSchema,
    constraint: z.literal(BRANCH_REFINEMENT_CONSTRAINT),
    originalResearch: BranchResearchSnapshotSchema,
  })
  .strict()
  .superRefine(({ branch, originalResearch }, context) => {
    if (originalResearch.branchId !== branch.id) {
      context.addIssue({
        code: "custom",
        message: "The original research must belong to the selected branch.",
        path: ["originalResearch", "branchId"],
      });
    }
  });

export const BranchRefinementResultSchema = z
  .object({
    branchId: z.string().trim().min(1).max(80),
    constraint: z.literal(BRANCH_REFINEMENT_CONSTRAINT),
    nodes: z.array(ResearchNodeSchema).min(1).max(5),
  })
  .strict()
  .superRefine(({ branchId, nodes }, context) => {
    if (nodes.some((node) => node.parentBranchId !== branchId)) {
      context.addIssue({
        code: "custom",
        message: "Every refined node must belong to the selected branch.",
        path: ["nodes"],
      });
    }
  });

export type BranchRefinementRequest = z.infer<
  typeof BranchRefinementRequestSchema
>;
export type BranchRefinementResult = z.infer<
  typeof BranchRefinementResultSchema
>;

export function buildBranchRefinementResearchRequest(
  input: BranchRefinementRequest,
): ResearchRequest {
  const parsed = BranchRefinementRequestSchema.parse(input);
  return ResearchRequestSchema.parse({
    profile: parsed.profile,
    branch: parsed.branch,
    question: parsed.constraint,
  });
}

export function validateBranchRefinementResult(input: unknown) {
  return BranchRefinementResultSchema.parse(input);
}
