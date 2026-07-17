import {
  ResearchGenerationSchema,
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
  const parsed = ResearchGenerationSchema.safeParse(output);
  if (!parsed.success) {
    throw new ResearchValidationError(
      "Research output does not match its schema.",
      "schema_validation",
      "output_schema",
    );
  }

  if (parsed.data.status === "no_useful_sources") {
    return parsed.data;
  }

  let retrieved: Set<string>;
  try {
    retrieved = new Set(retrievedSourceUrls.map(normalizedUrl));
  } catch {
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

  const nodeIds = parsed.data.nodes.map((node) => node.id);
  if (new Set(nodeIds).size !== nodeIds.length) {
    throw new ResearchValidationError(
      "Research nodes must have unique IDs.",
      "schema_validation",
      "duplicate_node_ids",
    );
  }

  for (const node of parsed.data.nodes) {
    if (node.parentBranchId !== branch.id) {
      throw new ResearchValidationError(
        "Research node is attached to the wrong branch.",
        "schema_validation",
        "parent_branch_mismatch",
      );
    }

    const nodeSourceUrls = new Set<string>();
    for (const source of node.sources) {
      if (source.dateChecked !== dateChecked) {
        throw new ResearchValidationError(
          "Research source freshness does not match the server check date.",
          "schema_validation",
          "date_checked_mismatch",
        );
      }
      let citedUrl: string;
      try {
        citedUrl = normalizedUrl(source.url);
      } catch {
        throw new ResearchValidationError(
          "Research output cites an invalid URL.",
          "source_processing",
          "cited_url_invalid",
        );
      }
      if (!retrieved.has(citedUrl)) {
        throw new ResearchValidationError(
          "Research output cites a URL that was not retrieved.",
          "source_processing",
          "citation_not_retrieved",
        );
      }
      nodeSourceUrls.add(citedUrl);
    }

    const referencedSourceUrls = new Set<string>();
    for (const url of node.titleSourceUrls) {
      const normalized = normalizedUrl(url);
      if (!nodeSourceUrls.has(normalized)) {
        throw new ResearchValidationError(
          "Research title cites evidence outside its node.",
          "schema_validation",
          "title_source_mismatch",
        );
      }
      referencedSourceUrls.add(normalized);
    }

    for (const claim of node.claims) {
      for (const url of claim.sourceUrls) {
        const normalized = normalizedUrl(url);
        if (!nodeSourceUrls.has(normalized)) {
          throw new ResearchValidationError(
            "Research claim cites evidence outside its node.",
            "schema_validation",
            "claim_source_mismatch",
          );
        }
        if (!retrieved.has(normalized)) {
          throw new ResearchValidationError(
            "Research claim cites a URL that was not retrieved.",
            "source_processing",
            "claim_citation_not_retrieved",
          );
        }
        referencedSourceUrls.add(normalized);
      }
    }

    if ([...nodeSourceUrls].some((url) => !referencedSourceUrls.has(url))) {
      throw new ResearchValidationError(
        "Research source evidence is not attached to a visible claim.",
        "schema_validation",
        "source_not_claimed",
      );
    }

    if (isAffordabilityResearchQuestion(question)) {
      const claimKinds = new Set(node.claims.map((claim) => claim.kind));
      const requiredKinds = ["cost", "eligibility", "conditional-aid"] as const;
      if (requiredKinds.some((kind) => !claimKinds.has(kind))) {
        throw new ResearchValidationError(
          "Affordability results require sourced cost, eligibility, and conditional-aid claims.",
          "schema_validation",
          "affordability_evidence_incomplete",
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
