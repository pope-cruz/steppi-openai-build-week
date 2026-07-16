import {
  ResearchGenerationSchema,
  ResearchRequestSchema,
  type PathBranch,
  type ResearchGeneration,
  type ResearchNode,
  type StudentProfile,
} from "@/lib/schemas";

export class ResearchValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResearchValidationError";
  }
}

function normalizedUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  if (url.pathname !== "/") {
    url.pathname = url.pathname.replace(/\/$/, "");
  }
  return url.toString();
}

function profileIds(profile: StudentProfile) {
  return new Set([
    ...profile.facts.map((item) => item.id),
    ...profile.inferences.map((item) => item.id),
    ...profile.constraints.map((item) => item.id),
    ...profile.uncertainties.map((item) => item.id),
    ...profile.tensions.map((item) => item.id),
  ]);
}

export function validateResearchContext(
  profile: StudentProfile,
  branch: PathBranch,
  question: string,
) {
  const parsed = ResearchRequestSchema.safeParse({ profile, branch, question });
  if (!parsed.success) {
    throw new ResearchValidationError("Research request is invalid.");
  }

  const validProfileIds = profileIds(profile);
  if (branch.supportingProfileIds.some((id) => !validProfileIds.has(id))) {
    throw new ResearchValidationError(
      "Selected branch references profile evidence that does not exist.",
    );
  }

  return parsed.data;
}

export function validateResearchGeneration(
  branch: PathBranch,
  output: unknown,
  retrievedSourceUrls: string[],
  dateChecked: string,
): ResearchGeneration {
  const parsed = ResearchGenerationSchema.safeParse(output);
  if (!parsed.success) {
    throw new ResearchValidationError("Research output does not match its schema.");
  }

  if (parsed.data.status === "no_useful_sources") {
    return parsed.data;
  }

  const retrieved = new Set(retrievedSourceUrls.map(normalizedUrl));
  if (retrieved.size === 0) {
    throw new ResearchValidationError("Research output has no retrieved source evidence.");
  }

  const nodeIds = parsed.data.nodes.map((node) => node.id);
  if (new Set(nodeIds).size !== nodeIds.length) {
    throw new ResearchValidationError("Research nodes must have unique IDs.");
  }

  for (const node of parsed.data.nodes) {
    if (node.parentBranchId !== branch.id) {
      throw new ResearchValidationError(
        "Research node is attached to the wrong branch.",
      );
    }

    for (const source of node.sources) {
      if (source.dateChecked !== dateChecked) {
        throw new ResearchValidationError(
          "Research source freshness does not match the server check date.",
        );
      }
      if (!retrieved.has(normalizedUrl(source.url))) {
        throw new ResearchValidationError(
          "Research output cites a URL that was not retrieved.",
        );
      }
    }
  }

  return parsed.data;
}

export function researchNodesForBranch(
  nodes: ResearchNode[],
  branchId: string,
) {
  return nodes.filter((node) => node.parentBranchId === branchId);
}
