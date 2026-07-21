import type { PathBranch } from "@/lib/schemas";

/** Fifteen-role pool used only by deterministic tests and local UI verification. */
const DEMO_PATH_BRANCH_POOL: PathBranch[] = [
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
      "What you shared suggests that organizing and presenting in collaborative settings may be worth exploring.",
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
      "Steppi’s tentative read of your collaborative experience may make sharing findings with a team worth testing.",
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
  {
    id: "role-digital-collections-archivist",
    title: "Digital collections archivist",
    summary:
      "Digital collections archivists organize and preserve photographs, recordings, documents, and other materials so people can find and understand them.",
    whyItAppeared: [
      "This could connect your visual interests with careful storytelling and technology that supports access rather than programming-heavy work.",
      "The role also offers a mix of independent organization and collaboration with researchers, librarians, or community partners.",
    ],
    supportingProfileIds: ["fact-interests", "fact-programming"],
    drawbacks: [
      "A large part of the work is methodical naming, checking, and documenting, which may feel slow if you want constant creative output.",
    ],
    dayToDay: [
      "A day may include reviewing a group of materials, describing what each item contains, and deciding how it should be organized.",
      "Archivists also check file quality, research missing context, and help other people locate useful material.",
    ],
    lowRiskExploration:
      "Organize a small collection of family or school photographs with clear titles, dates, and short descriptions that someone else can navigate.",
    unresolvedQuestions: [
      "Would the satisfaction of making information discoverable balance the repetitive care this work can require?",
    ],
    relatedOptions: [
      { id: "option-digital-archivist", label: "Digital archivist", type: "career" },
      { id: "option-library-information-science", label: "Library and information science", type: "major" },
    ],
  },
  {
    id: "role-digital-accessibility-tester",
    title: "Digital accessibility tester",
    summary:
      "Digital accessibility testers check whether websites and apps can be understood and used by people with different access needs.",
    whyItAppeared: [
      "This role could use your interest in digital products and clear communication while keeping the focus on how real people experience a design.",
      "It offers structured problem-solving without requiring programming to be the main activity.",
    ],
    supportingProfileIds: ["fact-interests", "fact-programming"],
    drawbacks: [
      "Testing can be repetitive and requires careful attention to standards, documentation, and small interaction details.",
    ],
    dayToDay: [
      "A tester may navigate a product by keyboard, review text and color choices, and document barriers in a form a product team can act on.",
      "The work often includes explaining findings, retesting changes, and learning from people who use different assistive tools.",
    ],
    lowRiskExploration:
      "Try using a familiar website with only a keyboard and write down every point where the next action becomes unclear.",
    unresolvedQuestions: [
      "Would you enjoy finding and documenting small usability barriers repeatedly?",
    ],
    relatedOptions: [
      { id: "option-accessibility-specialist", label: "Accessibility specialist", type: "career" },
      { id: "option-human-computer-interaction", label: "Human-computer interaction", type: "major" },
    ],
  },
  {
    id: "role-wayfinding-designer",
    title: "Wayfinding designer",
    summary:
      "Wayfinding designers create signs, maps, and visual systems that help people move through buildings and public spaces.",
    whyItAppeared: [
      "This could turn your visual problem-solving into practical work that people encounter in schools, hospitals, transport spaces, or events.",
      "It combines presentation, spatial thinking, and collaboration with people who plan or operate a place.",
    ],
    supportingProfileIds: ["inference-visual-thinking", "inference-collaboration"],
    drawbacks: [
      "The design must work within physical, safety, language, and installation constraints, so creative choices are rarely open-ended.",
    ],
    dayToDay: [
      "A day may include walking through a space, noticing where people hesitate, sketching a sign system, and testing whether directions are understood quickly.",
      "Designers coordinate with architects, printers, operators, and clients to make sure the system works in its real environment.",
    ],
    lowRiskExploration:
      "Redesign the directions for one confusing route around your school and test them with someone who does not usually take that route.",
    unresolvedQuestions: [
      "Would solving navigation problems within strict physical constraints feel creatively satisfying?",
    ],
    relatedOptions: [
      { id: "option-environmental-graphic-designer", label: "Environmental graphic designer", type: "career" },
      { id: "option-communication-design", label: "Communication design", type: "major" },
    ],
  },
  {
    id: "role-consumer-insights-analyst",
    title: "Consumer insights analyst",
    summary:
      "Consumer insights analysts study what people say and do, then explain patterns that can guide a product, service, or campaign.",
    whyItAppeared: [
      "This could use your interest in presenting ideas and collaborative work while giving you a clear question to investigate.",
      "It stays connected to products and communication without requiring you to make the final design yourself.",
    ],
    supportingProfileIds: ["fact-interests", "inference-collaboration"],
    drawbacks: [
      "The role can involve spreadsheets, careful sampling, and ambiguous evidence that does not always lead to a neat conclusion.",
    ],
    dayToDay: [
      "An analyst may review survey responses, interview notes, or purchasing patterns and look for themes that answer a specific business question.",
      "They turn those findings into a short explanation or presentation and discuss what the team should investigate next.",
    ],
    lowRiskExploration:
      "Ask ten peers the same focused question about a school, campus, or community service, group their answers into themes, and present the two strongest patterns.",
    unresolvedQuestions: [
      "Would working with incomplete patterns feel interesting or frustrating when there is no single correct answer?",
    ],
    relatedOptions: [
      { id: "option-insights-analyst", label: "Insights analyst", type: "career" },
      { id: "option-market-research", label: "Market research", type: "major" },
    ],
  },
  {
    id: "role-technical-documentation-specialist",
    title: "Technical documentation specialist",
    summary:
      "Technical documentation specialists create clear guides and reference material that help people understand a tool, process, or system.",
    whyItAppeared: [
      "Your interest in presenting ideas and making technology understandable could make this a practical form of communication work.",
      "The role often involves working with technical teammates without requiring you to spend most of the day programming.",
    ],
    supportingProfileIds: ["fact-interests", "fact-programming"],
    drawbacks: [
      "The work requires precise revisions and sustained attention to details that may be invisible when the document works well.",
    ],
    dayToDay: [
      "A specialist may test a process, interview someone who built it, draft instructions, and check whether a new user can follow them.",
      "They also update older material when a product changes and negotiate wording with subject experts.",
    ],
    lowRiskExploration:
      "Write a one-page guide for a school tool or process, then watch a classmate use it without giving them extra instructions.",
    unresolvedQuestions: [
      "Would precise explanatory writing hold your attention when the subject is not already familiar?",
    ],
    relatedOptions: [
      { id: "option-technical-writer", label: "Technical writer", type: "career" },
      { id: "option-professional-writing", label: "Professional writing", type: "major" },
    ],
  },
  {
    id: "role-event-experience-producer",
    title: "Event experience producer",
    summary:
      "Event experience producers coordinate the people, spaces, content, and timing that shape how an audience experiences an event.",
    whyItAppeared: [
      "This could combine your interest in presenting, visual outcomes, and collaborative work in a role with a clear public result.",
      "It also gives organizing strengths a creative setting rather than making administration the whole story.",
    ],
    supportingProfileIds: ["inference-collaboration", "inference-visual-thinking"],
    drawbacks: [
      "Event work can become deadline-heavy, and unexpected logistical problems may take priority over the creative parts.",
    ],
    dayToDay: [
      "A producer may review a run sheet, coordinate speakers or performers, check visual materials, and solve changes with venue and technical teams.",
      "Planning is spread over many weeks, while event days can be fast, social, and highly time-sensitive.",
    ],
    lowRiskExploration:
      "Help produce one school presentation or club event and take responsibility for the audience journey from arrival to the final activity.",
    unresolvedQuestions: [
      "Would the pressure of a fixed event date energize you or make the creative work less enjoyable?",
    ],
    relatedOptions: [
      { id: "option-event-producer", label: "Event producer", type: "career" },
      { id: "option-events-management", label: "Events management", type: "major" },
    ],
  },
  {
    id: "role-documentary-researcher",
    title: "Documentary researcher",
    summary:
      "Documentary researchers find people, records, images, and context that help a factual story become accurate and understandable.",
    whyItAppeared: [
      "This could connect your interest in explaining ideas with visual storytelling and collaborative creative production.",
      "It offers a way to shape the substance of a story even when you are not the person filming or presenting it.",
    ],
    supportingProfileIds: ["fact-interests", "inference-visual-thinking"],
    drawbacks: [
      "Research can involve long searches, unanswered messages, and careful fact-checking before any visible creative output appears.",
    ],
    dayToDay: [
      "A researcher may search archives, contact possible interviewees, verify a claim, and organize material for a writer, director, or editor.",
      "The work moves between independent investigation and frequent conversations about what the developing story still needs.",
    ],
    lowRiskExploration:
      "Research a three-minute factual video about a local story and create a source list, interview plan, and visual reference folder.",
    unresolvedQuestions: [
      "Would you enjoy the behind-the-scenes investigation even when someone else shapes the final story?",
    ],
    relatedOptions: [
      { id: "option-documentary-researcher", label: "Documentary researcher", type: "career" },
      { id: "option-media-studies", label: "Media studies", type: "major" },
    ],
  },
  {
    id: "role-gis-technician",
    title: "Geographic information systems technician",
    summary:
      "Geographic information systems technicians organize location-based information and turn it into maps that help people understand places and patterns.",
    whyItAppeared: [
      "This could give your visual problem-solving a technical but concrete form through maps, layers, and questions about real communities.",
      "It may let you work with digital tools without making software development the main career direction.",
    ],
    supportingProfileIds: ["inference-visual-thinking", "fact-programming"],
    drawbacks: [
      "The work can require careful data cleanup, consistent file organization, and learning specialized tools before the visual results become interesting.",
    ],
    dayToDay: [
      "A technician may prepare location data, check it for errors, build a map, and adjust labels or symbols so the result can be understood quickly.",
      "They often work with planners, researchers, or community teams that need a spatial question answered clearly.",
    ],
    lowRiskExploration:
      "Create a simple map of useful student resources near your school and ask two classmates what information the map is still missing.",
    unresolvedQuestions: [
      "Would learning specialized mapping tools feel worthwhile if much of the work begins with cleaning and organizing data?",
    ],
    relatedOptions: [
      { id: "option-gis-technician", label: "GIS technician", type: "career" },
      { id: "option-geography", label: "Geography", type: "major" },
    ],
  },
];

/** Normal thirteen-role assignment used by deterministic product fixtures. */
export const DEMO_PATH_BRANCHES: PathBranch[] = DEMO_PATH_BRANCH_POOL.slice(0, 13);

/** Complete fifteen-role assignment used to verify the upper cardinality and layout. */
export const DEMO_PATH_BRANCHES_MAX: PathBranch[] = DEMO_PATH_BRANCH_POOL;
