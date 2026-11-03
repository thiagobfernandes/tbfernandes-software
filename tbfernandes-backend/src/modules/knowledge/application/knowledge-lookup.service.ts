import { Injectable } from '@nestjs/common';
import { NoteRepository, SnippetRepository } from '../domain';
import { KnowledgeLookup, NoteView, SnippetView } from '../knowledge.lookup';

/** Implements the knowledge module's public API on top of its own repositories. */
@Injectable()
export class KnowledgeLookupService extends KnowledgeLookup {
  constructor(
    private readonly notesRepo: NoteRepository,
    private readonly snippetsRepo: SnippetRepository,
  ) {
    super();
  }

  async notes(ownerId: string): Promise<NoteView[]> {
    return (await this.notesRepo.search(ownerId, null, null)).map((note) => {
      const d = note.details;
      return {
        id: note.id,
        title: d.title,
        body: d.body,
        tags: d.tags,
        projectIds: [...note.links.projectIds],
        taskIds: [...note.links.taskIds],
      };
    });
  }

  async snippets(ownerId: string): Promise<SnippetView[]> {
    const all = await this.snippetsRepo.search(ownerId, {
      text: null,
      language: null,
      tag: null,
    });
    return all.map((snippet) => {
      const d = snippet.details;
      return {
        id: snippet.id,
        title: d.title,
        explanation: d.explanation,
        tags: d.tags,
        projectIds: [...snippet.links.projectIds],
        taskIds: [...snippet.links.taskIds],
      };
    });
  }
}
