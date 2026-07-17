const AFFORDABILITY_QUESTION_PATTERN =
  /\b(?:afford|affordable|budget|cost|costs|fee|fees|financial aid|scholarship|scholarships|tuition)\b/i;

export function isAffordabilityResearchQuestion(question: string) {
  return AFFORDABILITY_QUESTION_PATTERN.test(question);
}
