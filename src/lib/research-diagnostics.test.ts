import { describe, expect, it, vi } from "vitest";

import { recordResearchDiagnostic } from "./research-diagnostics";

describe("research diagnostics", () => {
  it("records only bounded classification metadata", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    recordResearchDiagnostic({
      category: "upstream_api",
      stage: "openai_request",
      reason: "request_rejected",
      upstreamStatus: 400,
      upstreamCode: "invalid_request_error",
      requestId: "req_safe123",
    });

    expect(error).toHaveBeenCalledWith("[research-diagnostic]", {
      category: "upstream_api",
      stage: "openai_request",
      reason: "request_rejected",
      upstreamStatus: 400,
      upstreamCode: "invalid_request_error",
      requestId: "req_safe123",
    });
    expect(JSON.stringify(error.mock.calls)).not.toContain("OPENAI_API_KEY");
    error.mockRestore();
  });

  it("drops unbounded upstream tokens instead of logging them", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    recordResearchDiagnostic({
      category: "upstream_api",
      stage: "openai request with spaces",
      reason: "raw message must not survive",
      upstreamCode: "secret value with spaces",
      requestId: "request id with spaces",
    });

    expect(error).toHaveBeenCalledWith("[research-diagnostic]", {
      category: "upstream_api",
      stage: "unknown",
      reason: "unknown",
    });
    error.mockRestore();
  });
});
