import type { StudentProfile } from "@/lib/schemas";

export const VALID_PROFILE_FIXTURE: StudentProfile = {
  facts: [
    {
      id: "fact-interests",
      statement: "The student is interested in art, technology, and digital products.",
      sourceAnswerIds: ["interests"],
    },
    {
      id: "fact-programming",
      statement: "The student does not enjoy programming-heavy work.",
      sourceAnswerIds: ["dislikes"],
    },
  ],
  inferences: [
    {
      id: "inference-collaboration",
      statement: "Collaborative product work may be worth exploring.",
      rationale: "The student enjoys presenting ideas and organizing group work.",
      confidence: "medium",
      editable: true,
    },
  ],
  constraints: [
    {
      id: "constraint-location",
      type: "geographic",
      statement: "Prefer options near Manila.",
      priority: "high",
    },
  ],
  uncertainties: [
    {
      id: "uncertainty-study",
      question: "Which kinds of college coursework feel engaging?",
      whyItMatters: "This can separate appealing work from appealing subject names.",
    },
  ],
  tensions: [
    {
      id: "tension-cs",
      description: "The student is considering computer science but dislikes programming-heavy work.",
      relatedFactIds: ["fact-programming"],
    },
  ],
};
