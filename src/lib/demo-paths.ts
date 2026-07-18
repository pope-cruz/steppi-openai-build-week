import type { PathBranch } from "@/lib/schemas";

/** Representative seven-role output used only by deterministic tests and local UI verification. */
export const DEMO_PATH_BRANCHES: PathBranch[] = [
  {
    id: "path-product-design",
    title: "Digital product designer",
    summary:
      "Digital product designers shape how websites and apps look, work, and respond to the people using them.",
    whyItAppeared: [
      "Your interest in visual problem-solving and digital products could make this worth testing.",
      "It offers a way to work with technology without making programming the center of the role.",
    ],
    supportingProfileIds: ["fact-interests", "inference-visual-thinking"],
    drawbacks: [
      "The work can involve repeated feedback and close collaboration with technical teammates, which may or may not suit you.",
    ],
    dayToDay: [
      "A typical day may move between learning what people need, sketching possible screens, and refining a prototype.",
      "Product designers often share unfinished work, listen to feedback, and revise details several times.",
    ],
    lowRiskExploration:
      "Redesign one confusing screen from an app you use and ask two friends to try your version.",
    unresolvedQuestions: [
      "Would you enjoy iterative design work when early ideas need substantial revision?",
    ],
    relatedOptions: [
      { id: "option-product-designer", label: "Product designer", type: "career" },
      { id: "option-interaction-design", label: "Interaction design", type: "major" },
    ],
  },
  {
    id: "role-science-communication-producer",
    title: "Science communication producer",
    summary:
      "Science communication producers turn complex technical ideas into stories, exhibits, videos, or public learning material.",
    whyItAppeared: [
      "This could connect your interest in technology with presenting ideas in a form other people can understand.",
      "It leaves room for visual thinking and collaboration without requiring a programming-heavy role.",
    ],
    supportingProfileIds: ["fact-interests", "fact-programming"],
    drawbacks: [
      "You may need to spend substantial time checking details and rewriting explanations before the creative work feels finished.",
    ],
    dayToDay: [
      "The work can include interviewing subject experts, planning a story, and translating unfamiliar terms into clear language.",
      "A day may shift between research, writing, visual planning, and reviewing drafts with specialists or creative teammates.",
    ],
    lowRiskExploration:
      "Create a one-minute visual explainer about a science or technology idea you recently encountered.",
    unresolvedQuestions: [
      "Would researching and explaining technical ideas feel interesting enough to balance the detail-checking involved?",
    ],
    relatedOptions: [
      { id: "option-science-writer", label: "Science writer", type: "career" },
      { id: "option-development-communication", label: "Development communication", type: "major" },
    ],
  },
  {
    id: "role-community-program-coordinator",
    title: "Community program coordinator",
    summary:
      "Community program coordinators organize activities and services that help a group learn, connect, or solve a shared need.",
    whyItAppeared: [
      "Your profile suggests that organizing and presenting in collaborative settings may be worth exploring.",
      "Community-based work can also make local relationships and staying near Manila more relevant.",
    ],
    supportingProfileIds: ["inference-collaboration", "constraint-location"],
    drawbacks: [
      "Program work can involve logistics, stakeholder disagreements, and administrative follow-through alongside the people-facing parts.",
    ],
    dayToDay: [
      "A typical day may include organizing sessions, speaking with participants, solving schedule problems, and keeping a small team aligned.",
      "The rhythm shifts between facilitation and quieter planning, follow-up, and administrative work.",
    ],
    lowRiskExploration:
      "Help plan one small school or neighborhood activity and notice which parts of coordinating people hold your interest.",
    unresolvedQuestions: [
      "Would you enjoy supporting a group over time, including the less visible coordination work?",
    ],
    relatedOptions: [
      { id: "option-program-coordinator", label: "Program coordinator", type: "career" },
      { id: "option-community-development", label: "Community development", type: "major" },
    ],
  },
  {
    id: "role-learning-experience-designer",
    title: "Human-centered learning experience designer",
    summary:
      "Learning experience designers plan lessons, activities, and digital materials that help people understand or practice something new.",
    whyItAppeared: [
      "This role could combine visual problem-solving, technology, and the challenge of making an idea easier for someone else to learn.",
      "Collaborative planning may draw on the way you organize and present ideas.",
    ],
    supportingProfileIds: ["inference-visual-thinking", "inference-collaboration"],
    drawbacks: [
      "Some projects involve detailed learning objectives, testing, and revision that can feel more structured than open-ended creative work.",
    ],
    dayToDay: [
      "A day may include talking with a teacher or subject expert, mapping a learning sequence, and drafting an activity or visual explanation.",
      "Designers test whether people understand the material and revise the experience when learners get stuck.",
    ],
    lowRiskExploration:
      "Turn one topic you know into a short activity that helps a classmate learn it without a lecture.",
    unresolvedQuestions: [
      "Would designing for someone else's learning feel as engaging as making visual work for its own sake?",
    ],
    relatedOptions: [
      { id: "option-instructional-designer", label: "Instructional designer", type: "career" },
      { id: "option-educational-technology", label: "Educational technology", type: "major" },
    ],
  },
  {
    id: "role-museum-exhibition-planner",
    title: "Museum exhibition planner",
    summary:
      "Museum exhibition planners shape how objects, stories, text, and spaces work together for visitors.",
    whyItAppeared: [
      "This could give your visual interests a physical and story-led form rather than keeping them entirely on a screen.",
      "It may also suit your tentative interest in collaborative projects with a clear public outcome.",
    ],
    supportingProfileIds: ["fact-interests", "inference-collaboration"],
    drawbacks: [
      "Exhibition projects can move slowly and require balancing creative ideas with budgets, collections, space, and many stakeholder opinions.",
    ],
    dayToDay: [
      "The work can include developing a visitor story, reviewing layouts, coordinating object information, and discussing practical constraints with a team.",
      "Some days are visual and spatial, while others focus on schedules, text, permissions, and detailed coordination.",
    ],
    lowRiskExploration:
      "Plan a small tabletop exhibit around five meaningful objects and ask someone to follow the story without your explanation.",
    unresolvedQuestions: [
      "Would the slower pace and practical constraints of physical exhibitions feel grounding or frustrating?",
    ],
    relatedOptions: [
      { id: "option-exhibition-designer", label: "Exhibition designer", type: "career" },
      { id: "option-museum-studies", label: "Museum studies", type: "major" },
    ],
  },
  {
    id: "role-user-research-specialist",
    title: "User research specialist",
    summary:
      "User research specialists study how people use a product or service and help teams understand what is confusing or useful.",
    whyItAppeared: [
      "This is one way to stay close to digital products while focusing more on people, questions, and patterns than programming.",
      "Your collaborative profile inference may make sharing findings with a team worth testing.",
    ],
    supportingProfileIds: ["fact-programming", "inference-collaboration"],
    drawbacks: [
      "The role requires patient listening, careful note-taking, and comfort reporting findings that may challenge a team's preferred idea.",
    ],
    dayToDay: [
      "A typical day may include planning interview questions, observing someone complete a task, and organizing notes into themes.",
      "Researchers then explain what they learned and help teammates decide what still needs to be tested.",
    ],
    lowRiskExploration:
      "Ask three classmates to complete the same school task and compare where each person hesitates or takes a different route.",
    unresolvedQuestions: [
      "Would careful observation and pattern-finding feel satisfying even when you are not the person designing the final solution?",
    ],
    relatedOptions: [
      { id: "option-ux-researcher", label: "UX researcher", type: "career" },
      { id: "option-behavioral-science", label: "Behavioral science", type: "major" },
    ],
  },
  {
    id: "role-creative-operations-producer",
    title: "Creative operations producer",
    summary:
      "Creative operations producers keep campaigns, media, or design projects moving by connecting people, schedules, and decisions.",
    whyItAppeared: [
      "This could use your interest in creative work together with the organizing and presenting strengths Steppi tentatively noticed.",
      "The role can stay connected to visual outcomes without requiring you to be the main designer or programmer.",
    ],
    supportingProfileIds: ["inference-collaboration", "inference-visual-thinking"],
    drawbacks: [
      "Much of the value comes from coordination, follow-up, and resolving bottlenecks, so the role may offer less hands-on making than you expect.",
    ],
    dayToDay: [
      "A day may involve checking project status, clarifying responsibilities, reviewing a creative brief, and helping teammates unblock a decision.",
      "The work often moves quickly between conversations, schedules, documents, and quality checks.",
    ],
    lowRiskExploration:
      "Coordinate a small creative project with two classmates and notice whether keeping the work moving feels rewarding.",
    unresolvedQuestions: [
      "Would you enjoy enabling other people's creative work when you are not making most of the final output yourself?",
    ],
    relatedOptions: [
      { id: "option-creative-producer", label: "Creative producer", type: "career" },
      { id: "option-project-management", label: "Project management", type: "major" },
    ],
  },
];
