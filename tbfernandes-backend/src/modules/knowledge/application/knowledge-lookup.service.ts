import { Injectable } from '@nestjs/common';
import { NoteRepository, SnippetRepository } from '../domain';
import { KnowledgeLookup, NoteView, SnippetView } from '../knowledge.lookup';

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
      const details = note.details;
      return {
        id: note.id,
        title: details.title,
        body: details.body,
        tags: details.tags,
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
      const details = snippet.details;
      return {
        id: snippet.id,
        title: details.title,
        explanation: details.explanation,
        tags: details.tags,
        projectIds: [...snippet.links.projectIds],
        taskIds: [...snippet.links.taskIds],
      };
    });
  }
}
