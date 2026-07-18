import type { PathBranch } from "@/lib/schemas";

/** Representative validated path output used only by deterministic tests and local UI verification. */
export const DEMO_PATH_BRANCHES: PathBranch[] = [
  {
    id: "path-product-design",
    kind: "strongest-fit",
    title: "Digital product design",
    summary:
      "Explore work that turns visual thinking and user needs into clear digital experiences, without assuming a programming-heavy role.",
    whyItAppeared: [
      "The profile connects creative interests with technology and digital products.",
      "Visual problem-solving appears repeatedly as a possible source of energy.",
    ],
    supportingProfileIds: ["fact-interests", "inference-visual-thinking"],
    drawbacks: [
      "Some roles still require comfort collaborating closely with technical teams and working through detailed feedback.",
    ],
    dayToDay: [
      "A typical day may move between learning what people need, sketching possible screens, and refining a prototype.",
      "Product designers often share unfinished work with teammates, listen to feedback, and revise details several times.",
    ],
    lowRiskExploration:
      "Redesign one confusing screen from an app you use and ask two friends to try your version.",
    unresolvedQuestions: [
      "Would the student enjoy iterative design work when early ideas need substantial revision?",
    ],
    relatedOptions: [
      { id: "option-product-designer", label: "Product designer", type: "career" },
      { id: "option-interaction-design", label: "Interaction design", type: "major" },
    ],
    confidence: "high",
  },
  {
    id: "path-communication-strategy",
    kind: "adjacent",
    title: "Digital communication strategy",
    summary:
      "Consider shaping how organizations explain ideas and reach people through campaigns, content systems, and collaborative planning.",
    whyItAppeared: [
      "The student is interested in digital products but does not want programming-heavy work.",
      "Collaborative product work is already a plausible profile inference.",
    ],
    supportingProfileIds: ["fact-programming", "inference-collaboration"],
    drawbacks: [
      "Communication work can involve ambiguous feedback and frequent coordination across different priorities.",
    ],
    dayToDay: [
      "The work often involves planning messages, shaping content, and deciding how an idea should reach a particular audience.",
      "A typical day may include writing, reviewing campaign material, checking audience feedback, and coordinating with creative teammates.",
    ],
    lowRiskExploration:
      "Create a one-week communication plan for a school club event and see which part of the process holds your interest.",
    unresolvedQuestions: [
      "Does the student prefer writing and audience research, or visual planning and presentation?",
    ],
    relatedOptions: [
      { id: "option-content-strategist", label: "Content strategist", type: "career" },
      { id: "option-communication", label: "Communication", type: "major" },
    ],
    confidence: "medium",
  },
  {
    id: "path-community-programs",
    kind: "underexplored",
    title: "Community program facilitation",
    summary:
      "Explore coordinating learning or community programs where organizing groups and presenting ideas matter more than building software.",
    whyItAppeared: [
      "The profile suggests the student may enjoy organizing and presenting in collaborative settings.",
      "A locally grounded option may fit the preference to remain near Manila.",
    ],
    supportingProfileIds: ["inference-collaboration", "constraint-location"],
    drawbacks: [
      "Program work may involve logistics, stakeholder disagreements, and less time on hands-on visual creation.",
    ],
    dayToDay: [
      "A typical day may include organizing sessions, speaking with participants, solving schedule problems, and keeping a small team aligned.",
      "The rhythm shifts between people-facing facilitation and quieter planning, follow-up, and administrative work.",
    ],
    lowRiskExploration:
      "Help plan one small school or neighborhood activity and notice whether coordinating people feels energizing or draining.",
    unresolvedQuestions: [
      "Would the student enjoy supporting groups over time, including administrative and coordination work?",
    ],
    relatedOptions: [
      { id: "option-program-coordinator", label: "Program coordinator", type: "career" },
      { id: "option-community-development", label: "Community development", type: "major" },
    ],
    confidence: "low",
  },
];
