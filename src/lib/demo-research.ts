import type { ResearchNode } from "@/lib/schemas";

export const DEMO_RESEARCH_QUESTION = "How can I try this before committing?";

const FIGMA_SOURCE = "https://help.figma.com/hc/en-us/categories/360002051613-Get-started";
const UPOU_SOURCE =
  "https://fics.upou.edu.ph/programs/bachelor-of-arts-in-multimedia-studies/";
const GOOGLE_UX_SOURCE = "https://grow.google/certificates/ux-design/";

/** Representative source-backed output used only by deterministic tests and local UI verification. */
export const DEMO_RESEARCH_NODES: ResearchNode[] = [
  {
    id: "research-product-design-figma",
    parentBranchId: "path-product-design",
    type: "resource",
    title: "Figma beginner material",
    titleSourceUrls: [FIGMA_SOURCE],
    claims: [
      {
        id: "figma-beginner-material",
        kind: "fact",
        statement: "Figma publishes official beginner material for learning and practicing with its design tool.",
        sourceUrls: [FIGMA_SOURCE],
      },
      {
        id: "figma-scope-limitation",
        kind: "limitation",
        statement: "The cited material covers tool learning, not the full research and collaboration involved in product design.",
        sourceUrls: [FIGMA_SOURCE],
      },
    ],
    relevanceToStudent:
      "This offers a bounded way to test visual problem-solving before choosing a longer course.",
    confidence: "high",
    sources: [
      {
        title: "Get started with Figma",
        publisher: "Figma Help Center",
        url: FIGMA_SOURCE,
        dateChecked: "2026-07-16",
      },
    ],
  },
  {
    id: "research-product-design-bams",
    parentBranchId: "path-product-design",
    type: "program",
    title: "Bachelor of Arts in Multimedia Studies",
    titleSourceUrls: [UPOU_SOURCE],
    claims: [
      {
        id: "upou-program-fact",
        kind: "fact",
        statement: "UP Open University describes a Bachelor of Arts in Multimedia Studies program.",
        sourceUrls: [UPOU_SOURCE],
      },
      {
        id: "upou-program-limitation",
        kind: "limitation",
        statement: "The cited program overview is not evidence of current admission, fee, or application details.",
        sourceUrls: [UPOU_SOURCE],
      },
    ],
    relevanceToStudent:
      "This gives the student a Philippine higher-education reference point for comparing visual, media, and technology study.",
    confidence: "medium",
    sources: [
      {
        title: "Bachelor of Arts in Multimedia Studies",
        publisher: "UP Open University",
        url: UPOU_SOURCE,
        dateChecked: "2026-07-16",
      },
    ],
  },
  {
    id: "research-product-design-ux-certificate",
    parentBranchId: "path-product-design",
    type: "resource",
    title: "Google UX Design Certificate",
    titleSourceUrls: [GOOGLE_UX_SOURCE],
    claims: [
      {
        id: "google-ux-outline",
        kind: "fact",
        statement: "Google publishes an outline and format for its UX Design Certificate.",
        sourceUrls: [GOOGLE_UX_SOURCE],
      },
      {
        id: "google-ux-limitation",
        kind: "limitation",
        statement: "The cited certificate page does not establish local degree requirements or guaranteed access and pricing.",
        sourceUrls: [GOOGLE_UX_SOURCE],
      },
    ],
    relevanceToStudent:
      "The outline can make an unfamiliar path more concrete before the student chooses a degree or longer course.",
    confidence: "medium",
    sources: [
      {
        title: "Google UX Design Certificate",
        publisher: "Grow with Google",
        url: GOOGLE_UX_SOURCE,
        dateChecked: "2026-07-16",
      },
    ],
  },
];

export const AUDIT_AFFORDABILITY_QUESTION = "What affordable options exist near Manila?";

const FIGMA_EDUCATION_SOURCE =
  "https://audit-fixture.steppi.test/figma-education";

/** Regression fixture for the live claim that added an unsupported no-code qualifier. */
export const AUDIT_FIGMA_PROTOTYPING_NODE: ResearchNode = {
  id: "audit-figma-prototyping",
  parentBranchId: "path-product-design",
  type: "resource",
  title: "Figma interface prototyping",
  titleSourceUrls: [FIGMA_EDUCATION_SOURCE],
  claims: [
    {
      id: "figma-interface-mockups",
      kind: "fact",
      statement: "Figma supports creating interface mockups.",
      sourceUrls: [FIGMA_EDUCATION_SOURCE],
    },
    {
      id: "figma-interactive-prototypes",
      kind: "fact",
      statement: "Figma supports creating interactive prototypes.",
      sourceUrls: [FIGMA_EDUCATION_SOURCE],
    },
    {
      id: "figma-evidence-limitation",
      kind: "limitation",
      statement:
        "Access to Figma's education plan depends on meeting its eligibility requirements.",
      sourceUrls: [FIGMA_EDUCATION_SOURCE],
    },
  ],
  relevanceToStudent:
    "These capabilities offer a focused way to try interface design before choosing a longer course.",
  confidence: "medium",
  sources: [
    {
      title: "Figma for Education",
      publisher: "Figma",
      url: FIGMA_EDUCATION_SOURCE,
      dateChecked: "2026-07-17",
    },
  ],
};

const UP_VISUAL_COMMUNICATION_SOURCE =
  "https://audit-fixture.steppi.test/up-visual-communication";

/** Regression fixture limited to what the cited program page explicitly identifies. */
export const AUDIT_UP_VISUAL_COMMUNICATION_NODE: ResearchNode = {
  id: "audit-up-visual-communication",
  parentBranchId: "path-product-design",
  type: "program",
  title: "UP Diliman Visual Communication",
  titleSourceUrls: [UP_VISUAL_COMMUNICATION_SOURCE],
  claims: [
    {
      id: "up-visual-communication-program",
      kind: "fact",
      statement: "UP Diliman's College of Fine Arts identifies Visual Communication as an academic program.",
      sourceUrls: [UP_VISUAL_COMMUNICATION_SOURCE],
    },
    {
      id: "up-visual-communication-scope",
      kind: "limitation",
      statement: "This fixture makes no broader curriculum or preparation claim beyond the cited program identification.",
      sourceUrls: [UP_VISUAL_COMMUNICATION_SOURCE],
    },
  ],
  relevanceToStudent:
    "It is a local program reference for a student exploring visual and technology-adjacent study.",
  confidence: "medium",
  sources: [
    {
      title: "Visual Communication",
      publisher: "UP Diliman College of Fine Arts",
      url: UP_VISUAL_COMMUNICATION_SOURCE,
      dateChecked: "2026-07-17",
    },
  ],
};

const CIIT_TUITION_SOURCE = "https://audit-fixture.steppi.test/ciit-tuition";
const CIIT_ADMISSIONS_SOURCE = "https://audit-fixture.steppi.test/ciit-admissions";
const CIIT_SCHOLARSHIP_SOURCE =
  "https://audit-fixture.steppi.test/ciit-scholarships";

/** Regression fixture for the affordability caveats omitted from the audited live result. */
export const AUDIT_CIIT_AFFORDABILITY_NODE: ResearchNode = {
  id: "audit-ciit-affordability",
  parentBranchId: "path-product-design",
  type: "program",
  title: "CIIT degree option",
  titleSourceUrls: [CIIT_TUITION_SOURCE],
  claims: [
    {
      id: "ciit-annual-cost",
      kind: "cost",
      statement: "The cited CIIT estimate is PHP 135,000–165,000 per academic year.",
      sourceUrls: [CIIT_TUITION_SOURCE],
    },
    {
      id: "ciit-admissions-eligibility",
      kind: "eligibility",
      statement: "Enrollment depends on meeting CIIT's cited admissions requirements.",
      sourceUrls: [CIIT_ADMISSIONS_SOURCE],
    },
    {
      id: "ciit-manila-location",
      kind: "fact",
      statement:
        "The cited admissions information identifies CIIT's Quezon City campus.",
      sourceUrls: [CIIT_ADMISSIONS_SOURCE],
    },
    {
      id: "ciit-scholarship-conditions",
      kind: "conditional-aid",
      statement: "CIIT scholarships are conditional on cited eligibility and retention requirements; aid is not guaranteed.",
      sourceUrls: [CIIT_SCHOLARSHIP_SOURCE],
    },
    {
      id: "ciit-affordability-limitation",
      kind: "limitation",
      statement: "The annual estimate and conditional aid do not establish that CIIT is affordable for this student.",
      sourceUrls: [CIIT_TUITION_SOURCE, CIIT_SCHOLARSHIP_SOURCE],
    },
    {
      id: "ciit-residency-limitation",
      kind: "limitation",
      statement:
        "The cited pages do not establish a Manila-residency discount or residency-based aid eligibility.",
      sourceUrls: [CIIT_TUITION_SOURCE, CIIT_SCHOLARSHIP_SOURCE],
    },
  ],
  relevanceToStudent:
    "The Quezon City location, explicit annual estimate, and aid conditions let the student compare this option against their practical constraint without labeling it affordable.",
  confidence: "medium",
  sources: [
    {
      title: "Tuition and fees",
      publisher: "CIIT Philippines",
      url: CIIT_TUITION_SOURCE,
      dateChecked: "2026-07-17",
    },
    {
      title: "Admissions",
      publisher: "CIIT Philippines",
      url: CIIT_ADMISSIONS_SOURCE,
      dateChecked: "2026-07-17",
    },
    {
      title: "Scholarships",
      publisher: "CIIT Philippines",
      url: CIIT_SCHOLARSHIP_SOURCE,
      dateChecked: "2026-07-17",
    },
  ],
};

export const DEMO_RETRIEVED_SOURCE_URLS = DEMO_RESEARCH_NODES.flatMap((node) =>
  node.sources.map((source) => source.url),
);

export const AUDIT_CIIT_RETRIEVED_SOURCE_URLS =
  AUDIT_CIIT_AFFORDABILITY_NODE.sources.map((source) => source.url);

export const AUDIT_FIGMA_RETRIEVED_SOURCE_URLS =
  AUDIT_FIGMA_PROTOTYPING_NODE.sources.map((source) => source.url);
