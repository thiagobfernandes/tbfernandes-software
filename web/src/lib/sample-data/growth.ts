// Seed data for Goals and Learning until the `goal` and `learning` API
// modules exist. Unlike work.ts, this is the real plan (Master's admission
// and its study track), kept here so the screens are usable today.
// Move it to the database when the API lands, then delete this file.

import type { Goal } from "@/features/goals/types/goal";
import type { LearningTrack } from "@/features/learning/types/learning";

export const sampleGoals: Goal[] = [
  {
    id: "g1",
    title: "Master's in Computer Science",
    description:
      "Get into the academic Master's program (PPGCC-CM) at UTFPR Campo Mourão, starting in the first semester of 2027.",
    motivation:
      "Deepen software architecture and AI, with research on architecture and LLMOps for RAG agents. The expected output is a scientific paper, not only software.",
    category: "education",
    status: "active",
    color: "violet",
    targetDate: "2027-03-15",
    learningTrackIds: ["l1"],
    milestones: [
      {
        id: "g1m1",
        title: "Ask the program coordination about the 2027 selection",
        dueDate: "2026-10-30",
        done: true,
      },
      {
        id: "g1m2",
        title: "Update the full Lattes CV",
        dueDate: "2026-11-30",
        done: false,
      },
      {
        id: "g1m3",
        title: "Get transcript with GPA and proof of work in the field",
        dueDate: "2026-11-30",
        done: false,
      },
      {
        id: "g1m4",
        title: "Choose research line (SE or CI-DS) and 2–3 advisors",
        dueDate: "2026-11-30",
        done: false,
      },
      {
        id: "g1m5",
        title: "Email an advisor with a research topic idea",
        dueDate: "2026-12-18",
        done: false,
      },
      {
        id: "g1m6",
        title: "Request recommendation letters (manager + professor)",
        dueDate: "2026-12-18",
        done: false,
      },
      {
        id: "g1m7",
        title: "Finish the Theory of Computation study track",
        dueDate: "2027-02-28",
        done: false,
      },
      {
        id: "g1m8",
        title: "Submit the application in the February round",
        dueDate: "2027-02-26",
        done: false,
      },
      {
        id: "g1m9",
        title: "Interview with the selection committee (early March)",
        dueDate: "2027-03-05",
        done: false,
      },
      {
        id: "g1m10",
        title: "Classes start (Mon–Thu)",
        dueDate: "2027-03-15",
        done: false,
      },
    ],
  },
];

export const sampleLearningTracks: LearningTrack[] = [
  {
    id: "l1",
    title: "Theory of Computation",
    description:
      "Prep for the program's mandatory course: automata, formal languages, computability, and complexity, following Sipser.",
    goalId: "g1",
    status: "not_started",
    color: "violet",
    startDate: "2026-11-02",
    targetDate: "2027-02-28",
    method: [
      "Watch one lesson of the module's main course",
      "Review the math that showed up in it",
      "Solve the matching UFMG exercise list",
      "Tick the topic and move on — 30–45 min a day, 4–5 days a week",
    ],
    modules: [
      {
        id: "l1m1",
        title: "Mathematical foundations",
        status: "not_started",
        targetDate: "2026-11-15",
        resourceIds: ["r3"],
        topics: [
          {
            id: "l1m1t1",
            title: "Sets, functions, and relations",
            done: false,
          },
          {
            id: "l1m1t2",
            title: "Propositional logic and quantifiers",
            done: false,
          },
          {
            id: "l1m1t3",
            title: "Proofs: direct, contradiction, induction",
            done: false,
          },
        ],
      },
      {
        id: "l1m2",
        title: "Finite automata and regular languages",
        status: "not_started",
        targetDate: "2026-12-06",
        resourceIds: ["r1", "r6", "r3"],
        topics: [
          {
            id: "l1m2t1",
            title: "Deterministic finite automata (DFA)",
            done: false,
          },
          {
            id: "l1m2t2",
            title: "Nondeterminism (NFA) and DFA equivalence",
            done: false,
          },
          { id: "l1m2t3", title: "Regular expressions", done: false },
          {
            id: "l1m2t4",
            title: "Pumping lemma (non-regular languages)",
            done: false,
          },
        ],
      },
      {
        id: "l1m3",
        title: "Context-free languages",
        status: "not_started",
        targetDate: "2026-12-20",
        resourceIds: ["r1", "r3"],
        topics: [
          {
            id: "l1m3t1",
            title: "Context-free grammars and Chomsky normal form",
            done: false,
          },
          { id: "l1m3t2", title: "Pushdown automata", done: false },
        ],
      },
      {
        id: "l1m4",
        title: "Turing machines",
        status: "not_started",
        targetDate: "2027-01-10",
        resourceIds: ["r2", "r7", "r4", "r3"],
        topics: [
          {
            id: "l1m4t1",
            title: "Formal definition and examples",
            done: false,
          },
          {
            id: "l1m4t2",
            title: "Variants: multitape and nondeterministic",
            done: false,
          },
          { id: "l1m4t3", title: "Church-Turing thesis", done: false },
        ],
      },
      {
        id: "l1m5",
        title: "Decidability and reducibility",
        status: "not_started",
        targetDate: "2027-01-31",
        resourceIds: ["r2", "r3"],
        topics: [
          {
            id: "l1m5t1",
            title: "Decidable and recognizable languages",
            done: false,
          },
          { id: "l1m5t2", title: "The halting problem", done: false },
          { id: "l1m5t3", title: "Mapping reducibility", done: false },
        ],
      },
      {
        id: "l1m6",
        title: "Complexity",
        status: "not_started",
        targetDate: "2027-02-28",
        resourceIds: ["r2", "r5"],
        topics: [
          { id: "l1m6t1", title: "Time complexity and big-O", done: false },
          { id: "l1m6t2", title: "P and NP", done: false },
          {
            id: "l1m6t3",
            title: "NP-completeness and polynomial reductions",
            done: false,
          },
        ],
      },
    ],
    resources: [
      {
        id: "r1",
        title: "Teoria da Computação",
        provider: "UFF · Prof. Luís Felipe Ignácio Cunha",
        kind: "video",
        role: "primary",
        use: "Foundation: automata and formal languages",
        url: "https://www.youtube.com/watch?v=R-zGvoFe0F0&list=PLt3uqPJ3gc4OnS7UNGV_KuFFpy-x_9ESB",
      },
      {
        id: "r2",
        title: "TCOMP",
        provider: "UFU · Prof. Felipe Louza",
        kind: "video",
        role: "primary",
        use: "Core: computability and complexity",
        url: "https://www.youtube.com/watch?v=fM3YNiEoQds&list=PLuARAw3cqFRBLFB9VuGbwFyh_RehmBX1c",
      },
      {
        id: "r3",
        title: "DCC129 · Fundamentos de Teoria da Computação",
        provider: "UFMG",
        kind: "exercises",
        role: "primary",
        use: "Slides and exercise lists for every module",
        url: "https://msalvimjr.github.io/webpage-dcc/teaching/ftc/",
      },
      {
        id: "r4",
        title: "ACH2043 · Introdução à Teoria da Computação",
        provider: "USP e-Aulas",
        kind: "video",
        role: "support",
        use: "Short videos for a single concept",
        url: "https://eaulas.usp.br/portal/video.action?idItem=21070",
      },
      {
        id: "r5",
        title: "Teoria da Computação",
        provider: "UFCG",
        kind: "video",
        role: "support",
        use: "Alternative full course",
        url: "https://www.youtube.com/playlist?list=PLxsW1pbl6DnUCSkv8VDUR-8REFf94wJgB",
      },
      {
        id: "r6",
        title: "Linguagens Formais e Autômatos",
        provider: "UFABC",
        kind: "video",
        role: "support",
        use: "Alternative for the foundation",
        url: "https://www.youtube.com/playlist?list=PL2W7er93mQ7Uu2zR7uUvj8I5Y7NmMAMZS",
      },
      {
        id: "r7",
        title: "Turing machine examples",
        provider: "Prof. Esdras L. Bispo Jr.",
        kind: "video",
        role: "support",
        use: "Worked Turing machine examples",
        url: "https://www.youtube.com/watch?v=ei0TuIwMsWo",
      },
      {
        id: "r8",
        title: "Introduction to the Theory of Computation",
        provider: "Michael Sipser",
        kind: "book",
        role: "primary",
        use: "Reference book behind every course above",
      },
    ],
  },
];

export function findLearningTrack(id: string) {
  return sampleLearningTracks.find((track) => track.id === id);
}

export function findGoal(id?: string) {
  return id ? sampleGoals.find((goal) => goal.id === id) : undefined;
}
