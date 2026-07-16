import type { ResearchNode } from "@/lib/schemas";

export const DEMO_RESEARCH_QUESTION = "How can I try this before committing?";

/** Representative source-backed output used only by deterministic tests and local UI verification. */
export const DEMO_RESEARCH_NODES: ResearchNode[] = [
  {
    id: "research-product-design-figma",
    parentBranchId: "path-product-design",
    type: "resource",
    title: "Prototype one small screen",
    summary:
      "Use Figma's beginner material to recreate and then improve one familiar app screen before deciding whether longer design study feels worthwhile.",
    relevanceToStudent:
      "This is a low-cost way to test visual problem-solving and iteration without committing to a programming-heavy course.",
    caveats: [
      "A short tool exercise tests interest in interface work, not the full research and collaboration involved in product design.",
    ],
    confidence: "high",
    sources: [
      {
        title: "Get started with Figma",
        publisher: "Figma Help Center",
        url: "https://help.figma.com/hc/en-us/categories/360002051613-Get-started",
        dateChecked: "2026-07-16",
        supports: "Provides official beginner material for learning and practicing in Figma.",
      },
    ],
  },
  {
    id: "research-product-design-bams",
    parentBranchId: "path-product-design",
    type: "program",
    title: "Inspect a multimedia degree pathway",
    summary:
      "Review the University of the Philippines Open University's multimedia studies overview and note which listed areas feel energizing or unappealing.",
    relevanceToStudent:
      "It offers a Philippine higher-education reference point for comparing visual, media, and technology study while location and cost remain important.",
    caveats: [
      "Program offerings, admissions details, and fees can change; verify them directly before making an application decision.",
    ],
    confidence: "medium",
    sources: [
      {
        title: "Bachelor of Arts in Multimedia Studies",
        publisher: "UP Open University",
        url: "https://fics.upou.edu.ph/programs/bachelor-of-arts-in-multimedia-studies/",
        dateChecked: "2026-07-16",
        supports: "Describes the university's Bachelor of Arts in Multimedia Studies program.",
      },
    ],
  },
  {
    id: "research-product-design-ux-certificate",
    parentBranchId: "path-product-design",
    type: "resource",
    title: "Sample a structured UX curriculum",
    summary:
      "Compare the topics in Google's UX Design Certificate with the parts of product design you want to test, then choose one topic for a small weekend experiment.",
    relevanceToStudent:
      "The outline can make an unfamiliar path more concrete before the student chooses a degree or pays for a longer course.",
    caveats: [
      "A professional certificate is not a substitute for checking local degree requirements, and access or pricing may vary.",
    ],
    confidence: "medium",
    sources: [
      {
        title: "Google UX Design Certificate",
        publisher: "Grow with Google",
        url: "https://grow.google/certificates/ux-design/",
        dateChecked: "2026-07-16",
        supports: "Describes the topics and format of Google's UX Design Certificate.",
      },
    ],
  },
];

export const DEMO_RETRIEVED_SOURCE_URLS = DEMO_RESEARCH_NODES.flatMap((node) =>
  node.sources.map((source) => source.url),
);
