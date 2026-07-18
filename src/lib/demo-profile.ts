import type { StudentProfile } from "@/lib/schemas";

/** Representative validated profile used only by deterministic tests and local UI verification. */
export const DEMO_PROFILE_FIXTURE: StudentProfile = {
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
    {
      id: "inference-visual-thinking",
      statement: "Visual problem-solving may be an energizing part of future work.",
      rationale: "The student repeatedly connected creative work with practical outcomes.",
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

export const DEMO_CONFIRMATION_SUMMARY =
  "You are drawn to visual, practical work that connects art and technology, and you have enjoyed presenting ideas and organizing group projects. You want room to collaborate and create without making heavy programming the center of your day, while keeping options near Manila in view.";
