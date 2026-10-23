// Initial method library from the frontend architecture doc.
// These are real starting content, kept here until the Methods API exists.

import type { Method } from "@/features/methods/types/method";

export const sampleMethods: Method[] = [
  {
    id: "commit",
    title: "Commit method",
    summary: "Prepare small, reviewed commits with a consistent message.",
    category: "development",
    tags: ["git", "review"],
    lastReviewed: "2026-10-23",
    steps: [
      {
        title: "Review the diff",
        detail:
          "Read every changed line with git diff --staged before committing.",
      },
      {
        title: "Keep the change focused",
        detail:
          "One intent per commit. Split unrelated changes with git add -p.",
      },
      {
        title: "Run checks",
        detail: "Tests, lint, and build as appropriate for the change.",
      },
      {
        title: "Write the message",
        detail:
          "Conventional Commits: type(scope): summary in the imperative, under 72 characters.",
      },
      {
        title: "Explain the why",
        detail: "Add a body when the reason is not obvious from the diff.",
      },
    ],
    examples: [
      {
        title: "Commit messages",
        content: [
          "feat(tasks): add board view grouped by status",
          "fix(projects): keep timeline bars inside the visible range",
          "refactor(api): extract Problem Details parsing",
          "docs: record modular monolith decision",
        ].join("\n"),
      },
    ],
  },
  {
    id: "bug-fixing",
    title: "Bug-fixing method",
    summary: "From reproduction to a tested, documented fix.",
    category: "quality",
    tags: ["debugging", "testing"],
    lastReviewed: "2026-10-23",
    steps: [
      { title: "Reproduce the bug" },
      { title: "Record expected vs. actual behavior" },
      { title: "Gather logs and relevant context" },
      { title: "Find a minimal reproduction" },
      {
        title: "Form and test a hypothesis",
        detail:
          "Change one thing at a time and confirm the cause before fixing.",
      },
      { title: "Implement the smallest safe fix" },
      {
        title: "Add or update regression tests",
        detail: "The test must fail without the fix.",
      },
      { title: "Review the diff and validate the fix" },
      {
        title: "Record the root cause and lessons",
        detail: "Link the note to the project or task.",
      },
    ],
  },
  {
    id: "meeting",
    title: "Meeting method",
    summary: "Meetings with a clear goal, decisions, and follow-up.",
    category: "communication",
    tags: ["meetings", "follow-up"],
    lastReviewed: "2026-10-23",
    steps: [
      { title: "Define the objective and agenda" },
      { title: "Gather the context you need beforehand" },
      { title: "Record decisions" },
      { title: "Record action items with owners and deadlines" },
      { title: "Share a concise summary afterward" },
      { title: "Follow up on open actions" },
    ],
    examples: [
      {
        title: "Summary template",
        content: [
          "Objective:",
          "Decisions:",
          "- ",
          "Action items (owner, deadline):",
          "- ",
          "Open questions:",
          "- ",
        ].join("\n"),
      },
    ],
  },
];
