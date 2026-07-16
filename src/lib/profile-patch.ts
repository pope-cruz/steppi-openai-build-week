import {
  ProfilePatchSchema,
  StudentProfileSchema,
  type ProfilePatch,
  type StudentProfile,
} from "@/lib/schemas";

export class ProfilePatchApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfilePatchApplicationError";
  }
}

function assertUnique(values: string[], label: string) {
  if (new Set(values).size !== values.length) {
    throw new ProfilePatchApplicationError(`${label} contains duplicate IDs.`);
  }
}

function cloneProfile(profile: StudentProfile): StudentProfile {
  return {
    facts: profile.facts.map((fact) => ({
      ...fact,
      sourceAnswerIds: [...fact.sourceAnswerIds],
    })),
    inferences: profile.inferences.map((inference) => ({ ...inference })),
    constraints: profile.constraints.map((constraint) => ({ ...constraint })),
    uncertainties: profile.uncertainties.map((uncertainty) => ({ ...uncertainty })),
    tensions: profile.tensions.map((tension) => ({
      ...tension,
      relatedFactIds: [...tension.relatedFactIds],
    })),
  };
}

export function applyProfilePatch(
  originalProfile: StudentProfile,
  input: unknown,
): StudentProfile {
  const original = StudentProfileSchema.parse(originalProfile);
  const patch = ProfilePatchSchema.parse(input);
  const result = cloneProfile(original);

  const inferenceIds = new Set(original.inferences.map((item) => item.id));
  const removalIds = patch.removeInferenceIds ?? [];
  const replacementIds =
    patch.replaceStatements?.map((replacement) => replacement.targetId) ?? [];

  assertUnique(removalIds, "removeInferenceIds");
  assertUnique(replacementIds, "replaceStatements");

  for (const targetId of [...removalIds, ...replacementIds]) {
    if (!inferenceIds.has(targetId)) {
      throw new ProfilePatchApplicationError(
        `Inference target "${targetId}" does not exist.`,
      );
    }
  }

  const removalSet = new Set(removalIds);
  for (const replacementId of replacementIds) {
    if (removalSet.has(replacementId)) {
      throw new ProfilePatchApplicationError(
        `Inference target "${replacementId}" cannot be removed and replaced together.`,
      );
    }
  }

  const existingFactIds = new Set(original.facts.map((item) => item.id));
  const addedFactIds = patch.addFacts?.map((item) => item.id) ?? [];
  assertUnique(addedFactIds, "addFacts");
  if (addedFactIds.some((id) => existingFactIds.has(id))) {
    throw new ProfilePatchApplicationError("addFacts contains an existing fact ID.");
  }

  const existingConstraintIds = new Set(
    original.constraints.map((item) => item.id),
  );
  const addedConstraintIds = patch.addConstraints?.map((item) => item.id) ?? [];
  assertUnique(addedConstraintIds, "addConstraints");
  if (addedConstraintIds.some((id) => existingConstraintIds.has(id))) {
    throw new ProfilePatchApplicationError(
      "addConstraints contains an existing constraint ID.",
    );
  }

  const replacements = new Map(
    patch.replaceStatements?.map((replacement) => [
      replacement.targetId,
      replacement.newStatement,
    ]),
  );

  result.inferences = result.inferences
    .filter((inference) => !removalSet.has(inference.id))
    .map((inference) => ({
      ...inference,
      statement: replacements.get(inference.id) ?? inference.statement,
    }));
  result.constraints.push(
    ...(patch.addConstraints?.map((constraint) => ({ ...constraint })) ?? []),
  );
  result.facts.push(
    ...(patch.addFacts?.map((fact) => ({
      ...fact,
      sourceAnswerIds: [...fact.sourceAnswerIds],
    })) ?? []),
  );

  return StudentProfileSchema.parse(result);
}

export function profilePatchHasChanges(patch: ProfilePatch | null): boolean {
  return Boolean(
    patch &&
      ((patch.removeInferenceIds?.length ?? 0) > 0 ||
        (patch.replaceStatements?.length ?? 0) > 0 ||
        (patch.addConstraints?.length ?? 0) > 0 ||
        (patch.addFacts?.length ?? 0) > 0),
  );
}
