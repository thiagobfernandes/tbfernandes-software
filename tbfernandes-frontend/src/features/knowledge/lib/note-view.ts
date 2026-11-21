import type { Note } from "@/features/knowledge/types/knowledge";
import type { Project } from "@/features/projects/types/project";
import { noteHref } from "@/features/knowledge/lib/graph";

export type NoteSort = "updated" | "created" | "title";
export type NoteGrouping = "none" | "date" | "project" | "tag" | "favorites";

/** Persisted as `tbf:notes:view`. */
export type NotesView = {
  sort: NoteSort;
  group: NoteGrouping;
  showExcerpt: boolean;
  showDate: boolean;
  readingWidth: "comfortable" | "full";
};

export const defaultNotesView: NotesView = {
  sort: "updated",
  group: "none",
  showExcerpt: true,
  showDate: true,
  readingWidth: "comfortable",
};

export const noteSortLabels: Record<NoteSort, string> = {
  updated: "Atualização",
  created: "Criação",
  title: "Título",
};

export const noteGroupLabels: Record<NoteGrouping, string> = {
  none: "Sem agrupamento",
  date: "Data",
  project: "Projeto",
  tag: "Tag",
  favorites: "Favoritas primeiro",
};

export type NoteFilters = {
  tags: string[];
  projectIds: string[];
  onlyFavorites: boolean;
};

export const emptyNoteFilters: NoteFilters = {
  tags: [],
  projectIds: [],
  onlyFavorites: false,
};

/** A note is a favorite when its link is a sidebar favorite: one source of truth. */
export const isFavoriteNote = (favorites: Set<string>, note: Note) =>
  favorites.has(noteHref(note.id));

export function sortNotes(notes: Note[], sort: NoteSort) {
  const list = [...notes];
  if (sort === "title")
    return list.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
  const key = sort === "created" ? "createdAt" : "updatedAt";
  return list.sort((a, b) => b[key].localeCompare(a[key]));
}

export type NoteSection = { key: string; label: string; notes: Note[] };

const day = (value: string) => value.slice(0, 10);

function daysBetween(from: string, to: string) {
  return Math.round(
    (Date.parse(`${day(to)}T00:00:00Z`) -
      Date.parse(`${day(from)}T00:00:00Z`)) /
      86_400_000,
  );
}

/** Splits an already sorted list into labeled sections, keeping the order inside. */
export function groupNotes(
  notes: Note[],
  grouping: NoteGrouping,
  {
    today,
    projects,
    favorites,
    sort,
  }: {
    today: string;
    projects: Project[];
    favorites: Set<string>;
    sort: NoteSort;
  },
): NoteSection[] {
  if (grouping === "none") return [{ key: "all", label: "", notes }];

  const sections = new Map<string, NoteSection>();
  const add = (key: string, label: string, note: Note) => {
    const section = sections.get(key) ?? { key, label, notes: [] };
    section.notes.push(note);
    sections.set(key, section);
  };

  if (grouping === "date") {
    const field = sort === "created" ? "createdAt" : "updatedAt";
    const order = ["today", "week", "month", "older"];
    const labels: Record<string, string> = {
      today: "Hoje",
      week: "Últimos 7 dias",
      month: "Últimos 30 dias",
      older: "Mais antigas",
    };
    for (const note of notes) {
      const age = daysBetween(note[field], today);
      const key =
        age <= 0 ? "today" : age <= 7 ? "week" : age <= 30 ? "month" : "older";
      add(key, labels[key], note);
    }
    return order.flatMap((key) => sections.get(key) ?? []);
  }

  if (grouping === "favorites") {
    for (const note of notes) {
      if (isFavoriteNote(favorites, note)) add("fav", "Favoritas", note);
      else add("rest", "Outras", note);
    }
    return ["fav", "rest"].flatMap((key) => sections.get(key) ?? []);
  }

  if (grouping === "project") {
    const names = new Map(projects.map((p) => [p.id, p.name]));
    for (const note of notes) {
      const ids = note.projectIds.filter((id) => names.has(id));
      if (ids.length === 0) add("none", "Sem projeto", note);
      // A note in two projects shows in both: each section is complete.
      ids.forEach((id) => add(id, names.get(id)!, note));
    }
  } else {
    for (const note of notes) {
      if (note.tags.length === 0) add("none", "Sem tag", note);
      note.tags.forEach((tag) =>
        add(tag.toLocaleLowerCase("pt-BR"), `#${tag}`, note),
      );
    }
  }
  return [...sections.values()].sort((a, b) =>
    a.key === "none"
      ? 1
      : b.key === "none"
        ? -1
        : a.label.localeCompare(b.label, "pt-BR"),
  );
}
