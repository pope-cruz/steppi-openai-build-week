import { IntakeRequestSchema, type IntakeAnswer } from "@/lib/schemas";

export const INTAKE_QUESTION_IDS = [
  "grade-level",
  "interests",
  "subjects-activities",
  "considering",
  "adaptive-follow-up",
  "dislikes",
  "constraints",
  "certainty",
] as const;

export type IntakeQuestionId = (typeof INTAKE_QUESTION_IDS)[number];
export type IntakeDraft = Partial<Record<IntakeQuestionId, string>>;

export type IntakeQuestion = {
  id: IntakeQuestionId;
  label: string;
  prompt: string;
  helper: string;
  placeholder: string;
  quickResponses?: string[];
  quickResponseMode?: "append" | "replace";
  adaptive?: boolean;
};

const FIXED_QUESTIONS: Record<
  Exclude<IntakeQuestionId, "adaptive-follow-up">,
  IntakeQuestion
> = {
  "grade-level": {
    id: "grade-level",
    label: "Starting point",
    prompt: "What grade are you in?",
    helper: "This keeps the next steps appropriate for where you are now.",
    placeholder: "For example, Grade 11",
    quickResponses: ["Grade 10", "Grade 11", "Grade 12"],
    quickResponseMode: "replace",
  },
  interests: {
    id: "interests",
    label: "What draws you in",
    prompt: "What kinds of things hold your attention?",
    helper: "Think about topics, problems, or activities you return to without being asked.",
    placeholder: "I keep coming back to…",
    quickResponses: ["Creative work", "Technology", "Helping people", "Organizing projects"],
    quickResponseMode: "append",
  },
  "subjects-activities": {
    id: "subjects-activities",
    label: "How you like to work",
    prompt: "Which subjects or activities do you enjoy most?",
    helper: "School subjects count, but so do clubs, hobbies, family projects, and things you learn on your own.",
    placeholder: "I enjoy… because…",
    quickResponses: ["Visual projects", "Presenting ideas", "Working with a team", "Building things"],
    quickResponseMode: "append",
  },
  considering: {
    id: "considering",
    label: "Ideas already on your mind",
    prompt: "Are there careers or majors you are already considering?",
    helper: "It is completely fine to be unsure or to have no specific path yet.",
    placeholder: "I have been thinking about…",
    quickResponses: ["I am still exploring"],
    quickResponseMode: "replace",
  },
  dislikes: {
    id: "dislikes",
    label: "What should not dominate",
    prompt: "What kinds of work would you prefer to avoid?",
    helper: "Knowing what drains you can be as useful as knowing what excites you.",
    placeholder: "I would rather not spend most of my time…",
    quickResponses: ["Heavy programming", "Constant public speaking", "Highly repetitive work", "Working alone all day"],
    quickResponseMode: "append",
  },
  constraints: {
    id: "constraints",
    label: "Real life matters",
    prompt: "What practical constraints should shape your options?",
    helper: "Cost, location, family responsibilities, access needs, and academic requirements can help make ideas more realistic—not less ambitious.",
    placeholder: "I need options that…",
    quickResponses: ["Stay near Manila", "Prioritize affordability", "Fit family responsibilities", "Offer an urban setting"],
    quickResponseMode: "append",
  },
  certainty: {
    id: "certainty",
    label: "Where you are today",
    prompt: "How certain do you feel about your next direction?",
    helper: "There is no right level of certainty. Steppi is designed for exploration.",
    placeholder: "Right now, I feel…",
    quickResponses: ["I am wide open", "I have a few ideas", "I am comparing a short list"],
    quickResponseMode: "replace",
  },
};

function adaptiveQuestion(draft: IntakeDraft): IntakeQuestion {
  const signal = [
    draft.interests,
    draft["subjects-activities"],
    draft.considering,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/computer|coding|program|software|technology|tech/.test(signal)) {
    return {
      id: "adaptive-follow-up",
      label: "Based on your interest in technology",
      prompt: "Which parts of technology feel interesting—and which parts make you hesitate?",
      helper: "For example, you might enjoy shaping digital products without wanting programming to be the main activity.",
      placeholder: "I like the idea of… but I am less interested in…",
      adaptive: true,
    };
  }

  if (/art|creative|design|visual|write|music/.test(signal)) {
    return {
      id: "adaptive-follow-up",
      label: "Based on the creative work you mentioned",
      prompt: "When you make something, which part of the process feels most satisfying?",
      helper: "Consider imagining the idea, understanding people, making the details, or helping a group finish it.",
      placeholder: "The part I enjoy most is…",
      adaptive: true,
    };
  }

  return {
    id: "adaptive-follow-up",
    label: "A little more context",
    prompt: "What would you want to experience more of in a future path?",
    helper: "Think about the people, pace, environment, or kind of contribution that would make work feel worthwhile.",
    placeholder: "I would like more opportunities to…",
    adaptive: true,
  };
}

export function getIntakeQuestions(draft: IntakeDraft): IntakeQuestion[] {
  return [
    FIXED_QUESTIONS["grade-level"],
    FIXED_QUESTIONS.interests,
    FIXED_QUESTIONS["subjects-activities"],
    FIXED_QUESTIONS.considering,
    adaptiveQuestion(draft),
    FIXED_QUESTIONS.dislikes,
    FIXED_QUESTIONS.constraints,
    FIXED_QUESTIONS.certainty,
  ];
}

export function intakePhase(index: number) {
  if (index < 3) {
    return { label: "Getting to know what matters to you", segment: 1 };
  }

  if (index < 6) {
    return { label: "Connecting the details", segment: 2 };
  }

  return { label: "A few details left", segment: 3 };
}

export function validateIntakeValue(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "Share a short answer before continuing.";
  }

  if (trimmed.length < 2) {
    return "Add a little more detail so Steppi can use this answer.";
  }

  if (trimmed.length > 800) {
    return "Keep this answer under 800 characters.";
  }

  return null;
}

export function applyQuickResponse(
  currentValue: string,
  response: string,
  mode: IntakeQuestion["quickResponseMode"] = "replace",
) {
  if (mode === "replace") {
    return response;
  }

  const entries = currentValue
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const alreadySelected = entries.some(
    (entry) => entry.toLowerCase() === response.toLowerCase(),
  );

  return (alreadySelected
    ? entries.filter((entry) => entry.toLowerCase() !== response.toLowerCase())
    : [...entries, response]
  ).join(", ");
}

export function buildIntakeAnswers(
  draft: IntakeDraft,
  answeredAt: string,
): IntakeAnswer[] {
  const questions = getIntakeQuestions(draft);
  const answers = questions.map((question) => ({
    questionId: question.id,
    question: question.prompt,
    answer: (draft[question.id] ?? "").trim(),
    answeredAt,
  }));

  return IntakeRequestSchema.parse({ answers }).answers;
}
