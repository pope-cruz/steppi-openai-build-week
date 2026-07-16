export type ResearchDiagnosticCategory =
  | "configuration"
  | "upstream_api"
  | "parsing"
  | "schema_validation"
  | "source_processing"
  | "timeout"
  | "rendering";

export type ResearchDiagnostic = {
  category: ResearchDiagnosticCategory;
  stage: string;
  reason: string;
  upstreamStatus?: number;
  upstreamCode?: string;
  requestId?: string;
};

export type ResearchDiagnosticRecorder = (
  diagnostic: ResearchDiagnostic,
) => void;

function safeToken(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return /^[a-zA-Z0-9_.:-]{1,120}$/.test(trimmed) ? trimmed : undefined;
}

export function safeDiagnosticToken(value: unknown) {
  return safeToken(value);
}

/** Records classification metadata only—never prompts, model output, or raw errors. */
export const recordResearchDiagnostic: ResearchDiagnosticRecorder = (
  diagnostic,
) => {
  console.error("[research-diagnostic]", {
    category: diagnostic.category,
    stage: safeToken(diagnostic.stage) ?? "unknown",
    reason: safeToken(diagnostic.reason) ?? "unknown",
    ...(diagnostic.upstreamStatus
      ? { upstreamStatus: diagnostic.upstreamStatus }
      : {}),
    ...(safeToken(diagnostic.upstreamCode)
      ? { upstreamCode: safeToken(diagnostic.upstreamCode) }
      : {}),
    ...(safeToken(diagnostic.requestId)
      ? { requestId: safeToken(diagnostic.requestId) }
      : {}),
  });
};

/** Keeps browser-side validation metadata safe without triggering a dev error overlay. */
export const recordClientResearchDiagnostic: ResearchDiagnosticRecorder = (
  diagnostic,
) => {
  console.info("[research-client-diagnostic]", {
    category: diagnostic.category,
    stage: safeToken(diagnostic.stage) ?? "unknown",
    reason: safeToken(diagnostic.reason) ?? "unknown",
  });
};
