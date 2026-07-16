import {
  PathGenerationSchema,
  StudentProfileSchema,
  type PathBranch,
  type StudentProfile,
} from "@/lib/schemas";

export class PathValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PathValidationError";
  }
}

const DIRECTION_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "career",
  "careers",
  "for",
  "in",
  "into",
  "of",
  "or",
  "path",
  "paths",
  "the",
  "to",
  "with",
]);

const UNSUPPORTED_CURRENT_CLAIM_PATTERNS = [
  /(?:₱|\$|php\s|usd\s)\s*\d/i,
  /\b(?:average|median|starting)\s+salary\b/i,
  /\b(?:earns?|pays?)\s+(?:about|around|approximately)?\s*(?:₱|\$|php|usd|\d)/i,
  /\b(?:acceptance|admission)\s+rate\b/i,
  /\b(?:employment|job)\s+(?:growth|demand|outlook)\b/i,
  /\b(?:ranked|ranking|top-ranked|best)\s+(?:college|program|university)\b/i,
  /\b(?:tuition|program|course)\s+costs?\s+(?:about|around|approximately)?\s*(?:₱|\$|php|usd|\d)/i,
  /\b\d+(?:\.\d+)?%\s+(?:acceptance|admission|employment|growth|demand)\b/i,
];

function stemToken(token: string) {
  if (token.length > 5 && token.endsWith("ing")) {
    return token.slice(0, -3);
  }

  if (token.length > 5 && token.endsWith("ers")) {
    return token.slice(0, -3);
  }

  if (token.length > 4 && token.endsWith("er")) {
    return token.slice(0, -2);
  }

  if (token.length > 4 && token.endsWith("s")) {
    return token.slice(0, -1);
  }

  return token;
}

export function normalizedPathName(value: string) {
  return Array.from(directionTokens(value)).sort().join(" ");
}

function directionTokens(value: string) {
  return new Set(
    value
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .filter((token) => !DIRECTION_STOP_WORDS.has(token))
      .map(stemToken),
  );
}

function jaccardSimilarity(left: Set<string>, right: Set<string>) {
  const intersection = Array.from(left).filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union === 0 ? 0 : intersection / union;
}

function directionText(branch: PathBranch) {
  return [branch.title, branch.summary, ...branch.relatedOptions.map((item) => item.label)].join(
    " ",
  );
}

function primaryOptionLabels(branch: PathBranch) {
  return new Set(
    branch.relatedOptions
      .filter((option) => option.type === "career" || option.type === "major")
      .map((option) => normalizedPathName(option.label)),
  );
}

function assertMeaningfullyDifferent(branches: PathBranch[]) {
  for (let leftIndex = 0; leftIndex < branches.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < branches.length; rightIndex += 1) {
      const left = branches[leftIndex];
      const right = branches[rightIndex];

      if (normalizedPathName(left.title) === normalizedPathName(right.title)) {
        throw new PathValidationError("Path branches contain duplicate normalized names.");
      }

      const titleSimilarity = jaccardSimilarity(
        directionTokens(left.title),
        directionTokens(right.title),
      );
      const directionSimilarity = jaccardSimilarity(
        directionTokens(directionText(left)),
        directionTokens(directionText(right)),
      );

      if (titleSimilarity >= 0.6 || directionSimilarity >= 0.76) {
        throw new PathValidationError("Path branches are too similar to compare usefully.");
      }
    }
  }

  const optionSets = branches.map(primaryOptionLabels);
  const sharedAcrossAll = Array.from(optionSets[0]).some(
    (label) => optionSets[1].has(label) && optionSets[2].has(label),
  );

  if (sharedAcrossAll) {
    throw new PathValidationError(
      "All path branches collapse into the same underlying direction.",
    );
  }
}

function assertNoUnsupportedCurrentClaims(branches: PathBranch[]) {
  for (const branch of branches) {
    const claimText = [
      branch.title,
      branch.summary,
      ...branch.whyItAppeared,
      ...branch.drawbacks,
    ].join(" ");

    if (UNSUPPORTED_CURRENT_CLAIM_PATTERNS.some((pattern) => pattern.test(claimText))) {
      throw new PathValidationError(
        "Path branches contain a current factual claim that requires research sources.",
      );
    }
  }
}

function profileItemIds(profile: StudentProfile) {
  return new Set([
    ...profile.facts.map((item) => item.id),
    ...profile.inferences.map((item) => item.id),
    ...profile.constraints.map((item) => item.id),
    ...profile.uncertainties.map((item) => item.id),
    ...profile.tensions.map((item) => item.id),
  ]);
}

export function validatePathGeneration(
  profileInput: unknown,
  generationInput: unknown,
): PathBranch[] {
  const profile = StudentProfileSchema.parse(profileInput);
  const generation = PathGenerationSchema.parse(generationInput);
  const branchIds = generation.branches.map((branch) => branch.id);

  if (new Set(branchIds).size !== branchIds.length) {
    throw new PathValidationError("Path branches must have unique stable IDs.");
  }

  const validProfileIds = profileItemIds(profile);
  for (const branch of generation.branches) {
    if (new Set(branch.supportingProfileIds).size !== branch.supportingProfileIds.length) {
      throw new PathValidationError("Path evidence references must be unique per branch.");
    }

    if (branch.supportingProfileIds.some((id) => !validProfileIds.has(id))) {
      throw new PathValidationError(
        "A path branch references profile evidence that does not exist.",
      );
    }
  }

  assertMeaningfullyDifferent(generation.branches);
  assertNoUnsupportedCurrentClaims(generation.branches);

  return generation.branches;
}
