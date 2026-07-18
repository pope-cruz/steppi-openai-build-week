import {
  ResearchGenerationCandidateSchema,
  ResearchGenerationSchema,
  ResearchNodeSchema,
  ResearchRequestSchema,
  type PathBranch,
  type ResearchGeneration,
  type ResearchNode,
  type StudentProfile,
} from "@/lib/schemas";
import type {
  ResearchDiagnosticCategory,
} from "@/lib/research-diagnostics";
import { isAffordabilityResearchQuestion } from "@/lib/research-intent";

export class ResearchValidationError extends Error {
  readonly category: ResearchDiagnosticCategory;
  readonly reason: string;

  constructor(
    message: string,
    category: ResearchDiagnosticCategory,
    reason: string,
  ) {
    super(message);
    this.name = "ResearchValidationError";
    this.category = category;
    this.reason = reason;
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
    throw new ResearchValidationError(
      "Research request is invalid.",
      "schema_validation",
      "request_schema",
    );
  }

  const validProfileIds = profileIds(profile);
  if (branch.supportingProfileIds.some((id) => !validProfileIds.has(id))) {
    throw new ResearchValidationError(
      "Selected branch references profile evidence that does not exist.",
      "schema_validation",
      "profile_evidence_reference",
    );
  }

  return parsed.data;
}

export function validateResearchGeneration(
  branch: PathBranch,
  question: string,
  output: unknown,
  retrievedSourceUrls: string[],
  dateChecked: string,
): ResearchGeneration {
  const parsed = ResearchGenerationCandidateSchema.safeParse(output);
  if (!parsed.success) {
    throw new ResearchValidationError(
      "Research output does not match its schema.",
      "schema_validation",
      "output_schema",
    );
  }

  if (parsed.data.status === "no_useful_sources") {
    return ResearchGenerationSchema.parse(parsed.data);
  }

  const retrieved = new Set<string>();
  for (const url of retrievedSourceUrls) {
    try {
      retrieved.add(normalizedUrl(url));
    } catch {
      // Invalid provider metadata cannot support a rendered citation. Other
      // valid provider URLs remain eligible for partial acceptance.
    }
  }
  if (retrieved.size === 0 && retrievedSourceUrls.length > 0) {
    throw new ResearchValidationError(
      "Retrieved source metadata contains an invalid URL.",
      "source_processing",
      "retrieved_url_invalid",
    );
  }
  if (retrieved.size === 0) {
    throw new ResearchValidationError(
      "Research output has no retrieved source evidence.",
      "source_processing",
      "retrieved_sources_missing",
    );
  }

  const validatedNodes: ResearchNode[] = [];
  const retainedNodeIds = new Set<string>();

  for (const node of parsed.data.nodes) {
    if (node.parentBranchId !== branch.id) {
      continue;
    }

    const validSources: typeof node.sources = [];
    const nodeSourceUrls = new Set<string>();
    for (const source of node.sources) {
      if (source.dateChecked !== dateChecked) {
        continue;
      }
      const citedUrl = normalizedUrl(source.url);
      if (!retrieved.has(citedUrl)) {
        continue;
      }
      if (nodeSourceUrls.has(source.url)) {
        continue;
      }
      nodeSourceUrls.add(source.url);
      validSources.push(source);
    }

    if (
      node.titleSourceUrls.length === 0 ||
      node.titleSourceUrls.some((url) => !nodeSourceUrls.has(url))
    ) {
      continue;
    }

    const validClaims: typeof node.claims = [];
    const claimIds = new Set<string>();
    const referencedSourceUrls = new Set<string>();
    for (const url of node.titleSourceUrls) {
      referencedSourceUrls.add(url);
    }

    for (const claim of node.claims) {
      if (
        claimIds.has(claim.id) ||
        claim.sourceUrls.length === 0 ||
        new Set(claim.sourceUrls).size !== claim.sourceUrls.length ||
        claim.sourceUrls.some((url) => !nodeSourceUrls.has(url))
      ) {
        continue;
      }
      claimIds.add(claim.id);
      validClaims.push(claim);
      claim.sourceUrls.forEach((url) => referencedSourceUrls.add(url));
    }

    const usedSources = validSources.filter((source) =>
      referencedSourceUrls.has(source.url),
    );

    if (isAffordabilityResearchQuestion(question)) {
      const claimKinds = new Set(validClaims.map((claim) => claim.kind));
      const requiredKinds = ["cost", "eligibility", "conditional-aid"] as const;
      if (requiredKinds.some((kind) => !claimKinds.has(kind))) {
        continue;
      }
      const hasResidencyCaveat = validClaims.some((claim) =>
        /\b(?:residen|citizenship|location-based)\w*/i.test(claim.statement),
      );
      if (!hasResidencyCaveat) {
        continue;
      }
      const unsupportedAffordabilityLabel = [
        node.title,
        node.relevanceToStudent,
        ...validClaims
          .filter((claim) => claim.kind !== "limitation")
          .map((claim) => claim.statement),
      ].some((value) => {
        const withoutExplicitDenial = value.replace(
          /\b(?:not|does not|do not|cannot|can't|without (?:calling|labeling|describing|establishing)(?: it| this option)?(?: as)?)\s+(?:affordable|low[- ]cost|budget[- ]friendly)\b/gi,
          "",
        );
        return /\b(?:affordable|low[- ]cost|budget[- ]friendly)\b/i.test(
          withoutExplicitDenial,
        );
      });
      if (unsupportedAffordabilityLabel) {
        continue;
      }
    }

    const validatedNode = ResearchNodeSchema.safeParse({
      ...node,
      claims: validClaims,
      sources: usedSources,
    });
    if (!validatedNode.success || retainedNodeIds.has(validatedNode.data.id)) {
      continue;
    }
    retainedNodeIds.add(validatedNode.data.id);
    validatedNodes.push(validatedNode.data);
  }

  if (validatedNodes.length === 0) {
    throw new ResearchValidationError(
      "Research output has no valid source-backed nodes.",
      "schema_validation",
      "no_valid_research_nodes",
    );
  }

  return ResearchGenerationSchema.parse({
    status: "success",
    nodes: validatedNodes,
  });
}

export function researchNodesForBranch(
  nodes: ResearchNode[],
  branchId: string,
) {
  return nodes.filter((node) => node.parentBranchId === branchId);
}
