import { describe, expect, it } from "vitest";

import { BRANCH_LABELS, INTAKE_PATH } from "./product";

describe("product shell constants", () => {
  it("routes the primary action to the future intake flow", () => {
    expect(INTAKE_PATH).toBe("/intake");
  });

  it("previews exactly three equally named exploration branches", () => {
    expect(BRANCH_LABELS).toHaveLength(3);
    expect(new Set(BRANCH_LABELS).size).toBe(3);
  });
});
