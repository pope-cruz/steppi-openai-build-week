import { describe, expect, it } from "vitest";

import { DEMO_INTAKE_ANSWERS } from "@/lib/demo-intake";
import {
  applyQuickResponse,
  buildIntakeAnswers,
  getIntakeQuestions,
  intakePhase,
  type IntakeDraft,
  validateIntakeValue,
} from "@/lib/intake-flow";

const demoDraft = Object.fromEntries(
  DEMO_INTAKE_ANSWERS.map((answer) => [
    answer.questionId,
    Array.isArray(answer.answer) ? answer.answer.join(", ") : answer.answer,
  ]),
) as IntakeDraft;

describe("intake flow", () => {
  it("adapts the follow-up to technology context", () => {
    const questions = getIntakeQuestions(demoDraft);
    const followUp = questions.find(
      (question) => question.id === "adaptive-follow-up",
    );

    expect(followUp).toMatchObject({
      adaptive: true,
      label: "Based on your interest in technology",
    });
    expect(followUp?.prompt).toContain("technology");
  });

  it("uses a creative follow-up when that is the strongest signal", () => {
    const questions = getIntakeQuestions({
      interests: "Illustration and creative writing",
      considering: "I am still exploring",
    });
    const followUp = questions.find(
      (question) => question.id === "adaptive-follow-up",
    );

    expect(followUp?.label).toContain("creative work");
  });

  it("provides phase-based progress without an exact question count", () => {
    expect(intakePhase(0)).toEqual({
      label: "Getting to know what matters to you",
      segment: 1,
    });
    expect(intakePhase(4).segment).toBe(2);
    expect(intakePhase(7).segment).toBe(3);
  });

  it("validates required, useful-length answers", () => {
    expect(validateIntakeValue(" ")).toContain("before continuing");
    expect(validateIntakeValue("x")).toContain("more detail");
    expect(validateIntakeValue("Grade 11")).toBeNull();
  });

  it("toggles additive quick responses and replaces single choices", () => {
    expect(applyQuickResponse("Technology", "Creative work", "append")).toBe(
      "Technology, Creative work",
    );
    expect(
      applyQuickResponse("Technology, Creative work", "Technology", "append"),
    ).toBe("Creative work");
    expect(applyQuickResponse("Grade 10", "Grade 11", "replace")).toBe(
      "Grade 11",
    );
  });

  it("builds a schema-valid request while rejecting incomplete drafts", () => {
    const completeDraft: IntakeDraft = {
      ...demoDraft,
      "adaptive-follow-up":
        "I enjoy shaping digital products, but not programming-heavy work.",
    };
    const answers = buildIntakeAnswers(
      completeDraft,
      "2026-07-16T06:00:00.000Z",
    );

    expect(answers).toHaveLength(8);
    expect(answers[4].questionId).toBe("adaptive-follow-up");
    expect(() =>
      buildIntakeAnswers({ "grade-level": "Grade 11" }, "2026-07-16T06:00:00.000Z"),
    ).toThrow();
  });
});
