import type {
  RoleConversationAssistantMessage,
  RoleConversationGeneration,
} from "@/lib/role-conversation";

export const DEMO_INTERPRETIVE_ROLE_RESPONSE: RoleConversationGeneration = {
  mode: "interpretive",
  answerBlocks: [
    {
      id: "answer-work-rhythm",
      text: "The surprising part may be how much of the work happens before anything looks finished. You would spend time understanding people, sorting through competing ideas, and explaining choices—not only making visuals. That mix could suit your interest in organizing information and collaborating, while showing whether you enjoy the less-visible reasoning behind creative work.",
      sourceUrls: [],
    },
  ],
  relevanceToStudent:
    "This connects to the way you described turning ideas into clear, visual outcomes.",
  caveat:
    "Teams divide this work differently, so the balance between research, discussion, and visual making can vary.",
  nextStep:
    "Choose one app you use and write down one design decision that makes it easier or harder to understand.",
  sources: [],
};

const DEMO_PROGRAM_URL =
  "https://fics.upou.edu.ph/programs/bachelor-of-arts-in-multimedia-studies/";

export const DEMO_RESEARCHED_ROLE_RESPONSE: RoleConversationGeneration = {
  mode: "researched",
  answerBlocks: [
    {
      id: "answer-study-direction",
      text: "One current example is UP Open University’s Bachelor of Arts in Multimedia Studies, which connects communication, media, and technology. Its published overview describes an interdisciplinary program that develops both critical understanding and practical skills for multimedia work.",
      sourceUrls: [DEMO_PROGRAM_URL],
    },
    {
      id: "answer-study-interpretation",
      text: "That does not make it the only route, but it gives you a concrete program to compare with design-focused and technology-focused options. Looking at those differences can show whether you are more excited by storytelling, visual design, or the systems behind digital experiences.",
      sourceUrls: [],
    },
  ],
  relevanceToStudent:
    "It is relevant because you want creative work that stays connected to technology without making programming the center.",
  caveat:
    "The cited overview does not by itself verify current admission, fee, or application details.",
  nextStep:
    "Compare its current course descriptions with one visual communication program and note which projects sound more interesting.",
  sources: [
    {
      title: "Bachelor of Arts in Multimedia Studies",
      publisher: "UP Open University",
      url: DEMO_PROGRAM_URL,
      dateChecked: "2026-07-20",
    },
  ],
};

export function developmentRoleConversationMessage({
  branchId,
  requestId,
  researched = false,
}: {
  branchId: string;
  requestId: string;
  researched?: boolean;
}): RoleConversationAssistantMessage {
  return {
    id: `assistant-${requestId}`,
    role: "assistant",
    branchId,
    createdAt: "2026-07-20T12:00:00.000+08:00",
    ...(researched
      ? DEMO_RESEARCHED_ROLE_RESPONSE
      : DEMO_INTERPRETIVE_ROLE_RESPONSE),
  };
}
