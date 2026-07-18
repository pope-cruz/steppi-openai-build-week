import { describe, expect, it } from "vitest";

import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

import {
  normalizedPathName,
  PathValidationError,
  validatePathGeneration,
} from "./path-validation";

function generationFixture() {
  return { branches: structuredClone(DEMO_PATH_BRANCHES) };
}

describe("path generation validation", () => {
  it("accepts seven varied roles with valid profile evidence", () => {
    expect(validatePathGeneration(VALID_PROFILE_FIXTURE, generationFixture())).toEqual(
      DEMO_PATH_BRANCHES,
    );
  });

  it("normalizes punctuation, order, and simple word forms in path names", () => {
    expect(normalizedPathName("Designers in Digital Products")).toBe(
      normalizedPathName("Digital product design"),
    );
  });

  it("rejects nonexistent and repeated profile evidence references", () => {
    const nonexistent = generationFixture();
    nonexistent.branches[0].supportingProfileIds = ["fact-does-not-exist"];
    expect(() =>
      validatePathGeneration(VALID_PROFILE_FIXTURE, nonexistent),
    ).toThrow(PathValidationError);

    const repeated = generationFixture();
    repeated.branches[0].supportingProfileIds = [
      "fact-interests",
      "fact-interests",
    ];
    expect(() => validatePathGeneration(VALID_PROFILE_FIXTURE, repeated)).toThrow(
      PathValidationError,
    );
  });

  it("rejects duplicate normalized names", () => {
    const generation = generationFixture();
    generation.branches[1].title = "Design in digital products";

    expect(() => validatePathGeneration(VALID_PROFILE_FIXTURE, generation)).toThrow(
      "duplicate normalized names",
    );
  });

  it("rejects duplicate stable identifiers", () => {
    const generation = generationFixture();
    generation.branches[1].id = generation.branches[0].id;

    expect(() => validatePathGeneration(VALID_PROFILE_FIXTURE, generation)).toThrow(
      "unique stable IDs",
    );
  });

  it("rejects superficially different explanations for the same direction", () => {
    const generation = generationFixture();
    generation.branches[1].title = "Product experience design";
    generation.branches[1].summary = generation.branches[0].summary;
    generation.branches[1].relatedOptions = structuredClone(
      generation.branches[0].relatedOptions,
    );

    expect(() => validatePathGeneration(VALID_PROFILE_FIXTURE, generation)).toThrow(
      "too similar",
    );
  });

  it("rejects a role set that collapses into one underlying option", () => {
    const generation = generationFixture();
    for (const branch of generation.branches) {
      branch.relatedOptions.push({
        id: `${branch.id}-shared-option`,
        label: "Product designer",
        type: "career",
      });
    }

    expect(() => validatePathGeneration(VALID_PROFILE_FIXTURE, generation)).toThrow(
      "same underlying direction",
    );
  });

  it("rejects unsupported current claims that require research sources", () => {
    const generation = generationFixture();
    generation.branches[0].summary =
      "The average salary is $100000, which has not been sourced.";

    expect(() => validatePathGeneration(VALID_PROFILE_FIXTURE, generation)).toThrow(
      "requires research sources",
    );

    const dayToDayClaim = generationFixture();
    dayToDayClaim.branches[0].dayToDay[0] =
      "Product designers earn an average salary of $100000.";
    expect(() =>
      validatePathGeneration(VALID_PROFILE_FIXTURE, dayToDayClaim),
    ).toThrow("requires research sources");
  });
});
