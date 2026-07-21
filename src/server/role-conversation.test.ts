import OpenAI from "openai";
import { describe, expect, it, vi } from "vitest";

import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";
import { DEMO_CONFIRMATION_SUMMARY } from "@/lib/demo-profile";
import {
  DEMO_INTERPRETIVE_ROLE_RESPONSE,
  DEMO_RESEARCHED_ROLE_RESPONSE,
} from "@/lib/demo-role-conversation";
import type { RoleConversationRequest } from "@/lib/role-conversation";
import {
  buildRoleConversationResponseParams,
  generateRoleConversationMessage,
  RoleConversationGenerationError,
} from "@/server/role-conversation";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

function request(question = "What might surprise me about this work?"): RoleConversationRequest {
  return {
    profile: VALID_PROFILE_FIXTURE,
    confirmedSummary: DEMO_CONFIRMATION_SUMMARY,
    branch: DEMO_PATH_BRANCHES[0],
    history: [],
    question,
    requestId: "request-1",
    safetyIdentifier: "safe-session-1",
  };
}

describe("role conversation generation", () => {
  it("uses one low-latency stored-false GPT-5.6 response without search tools for interpretation", () => {
    const params = buildRoleConversationResponseParams({
      request: request(),
      dateChecked: "2026-07-20",
      model: "gpt-5.6",
    });

    expect(params.store).toBe(false);
    expect(params.reasoning).toEqual({ effort: "none" });
    expect(params.text.verbosity).toBe("low");
    expect(params).not.toHaveProperty("tools");
    expect(params).not.toHaveProperty("tool_choice");
    expect(params).not.toHaveProperty("include");
    expect(params.safety_identifier).toBe("safe-session-1");
    expect(params.max_output_tokens).toBe(2_200);
    expect(params.instructions).toContain("50–90 words");
    expect(params.instructions).toContain("70–120 words");
    expect(params.instructions).toContain("high-school and college students");
    expect(params.instructions).toContain("stage-neutral");
    expect(params.input).toContain(DEMO_CONFIRMATION_SUMMARY);
    expect(params.input).toContain(DEMO_PATH_BRANCHES[0].title);
  });

  it("forces web search for unstable current-fact questions", () => {
    const params = buildRoleConversationResponseParams({
      request: request("Are there affordable college programs near Manila?"),
      dateChecked: "2026-07-20",
      model: "gpt-5.6",
    });

    expect(params.tool_choice).toBe("required");
    expect(params.tools).toHaveLength(1);
    expect(params.include).toEqual(["web_search_call.action.sources"]);
  });

  it("returns a concise interpretive message without retrieval", async () => {
    const message = await generateRoleConversationMessage(request(), {
      apiKey: "test-key",
      model: "gpt-5.6",
      now: () => "2026-07-20T12:00:00.000+08:00",
      requestConversation: vi.fn().mockResolvedValue({
        output: DEMO_INTERPRETIVE_ROLE_RESPONSE,
        retrievedSourceUrls: [],
        retrievalStatus: "missing",
      }),
    });

    expect(message.mode).toBe("interpretive");
    expect(message.sources).toEqual([]);
    expect(message.branchId).toBe(DEMO_PATH_BRANCHES[0].id);
    expect(message.id).toBe("assistant-request-1");
  });

  it("keeps only provider-retrieved URLs and overwrites the checked date", async () => {
    const sourceUrl = DEMO_RESEARCHED_ROLE_RESPONSE.sources[0].url;
    const message = await generateRoleConversationMessage(
      request("What could I study for this role?"),
      {
        apiKey: "test-key",
        model: "gpt-5.6",
        dateChecked: "2026-07-21",
        requestConversation: vi.fn().mockResolvedValue({
          output: DEMO_RESEARCHED_ROLE_RESPONSE,
          retrievedSourceUrls: [sourceUrl],
          retrievalStatus: "completed",
        }),
      },
    );

    expect(message.mode).toBe("researched");
    expect(message.sources).toHaveLength(1);
    expect(message.sources[0].dateChecked).toBe("2026-07-21");
  });

  it("returns an honest unavailable answer when no cited block survives", async () => {
    const message = await generateRoleConversationMessage(
      request("What could I study for this role?"),
      {
        apiKey: "test-key",
        model: "gpt-5.6",
        requestConversation: vi.fn().mockResolvedValue({
          output: DEMO_RESEARCHED_ROLE_RESPONSE,
          retrievedSourceUrls: ["https://example.edu/different-program"],
          retrievalStatus: "completed",
        }),
      },
    );

    expect(message.mode).toBe("unavailable");
    expect(message.sources).toEqual([]);
    expect(message.answerBlocks[0].text).toContain("could not verify");
  });

  it("classifies configuration, timeout, and malformed output safely", async () => {
    await expect(
      generateRoleConversationMessage(request(), { apiKey: "" }),
    ).rejects.toMatchObject({ code: "configuration_missing" });

    await expect(
      generateRoleConversationMessage(request(), {
        apiKey: "test-key",
        requestConversation: vi.fn().mockRejectedValue(
          new OpenAI.APIConnectionTimeoutError({ message: "timeout" }),
        ),
      }),
    ).rejects.toMatchObject({ code: "timeout" });

    await expect(
      generateRoleConversationMessage(request(), {
        apiKey: "test-key",
        requestConversation: vi.fn().mockResolvedValue({
          output: { mode: "interpretive" },
          retrievedSourceUrls: [],
          retrievalStatus: "missing",
        }),
      }),
    ).rejects.toBeInstanceOf(RoleConversationGenerationError);
  });
});
