import type { IntakeAnswer } from "@/lib/schemas";

export const DEMO_INTAKE_ANSWERS: IntakeAnswer[] = [
  {
    questionId: "grade-level",
    question: "What grade are you in?",
    answer: "Grade 11",
    answeredAt: "2026-07-16T04:00:00.000Z",
  },
  {
    questionId: "interests",
    question: "What kinds of things hold your attention?",
    answer: ["Art", "Technology", "Digital products", "Coordinating projects"],
    answeredAt: "2026-07-16T04:01:00.000Z",
  },
  {
    questionId: "subjects-activities",
    question: "Which subjects or activities do you enjoy?",
    answer: "I like visual projects, presenting ideas, and organizing group work.",
    answeredAt: "2026-07-16T04:02:00.000Z",
  },
  {
    questionId: "considering",
    question: "Are there careers or majors you are already considering?",
    answer: "Computer science, but I am not sure it fits me.",
    answeredAt: "2026-07-16T04:03:00.000Z",
  },
  {
    questionId: "dislikes",
    question: "What work would you prefer to avoid?",
    answer: "I do not enjoy programming-heavy work.",
    answeredAt: "2026-07-16T04:04:00.000Z",
  },
  {
    questionId: "constraints",
    question: "What practical constraints should shape your options?",
    answer: "I need affordable options near Manila and prefer an urban environment.",
    answeredAt: "2026-07-16T04:05:00.000Z",
  },
  {
    questionId: "certainty",
    question: "How certain do you feel right now?",
    answer: "I have a few ideas, but I am still exploring.",
    answeredAt: "2026-07-16T04:06:00.000Z",
  },
];
