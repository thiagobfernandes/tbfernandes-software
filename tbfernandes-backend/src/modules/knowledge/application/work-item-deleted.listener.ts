import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UnitOfWork } from '../../../common/application';
import { WorkEvents } from '../../work';
import type { ProjectDeleted, TaskDeleted } from '../../work';
import { NoteRepository, SnippetRepository } from '../domain';

/**
 * KNW-06: when a project or task is deleted, notes and snippets drop the link and stay.
 * Runs after the work transaction commits, in its own transaction.
 */
@Injectable()
export class WorkItemDeletedListener {
  constructor(
    private readonly notes: NoteRepository,
    private readonly snippets: SnippetRepository,
    private readonly uow: UnitOfWork,
  ) {}

  @OnEvent(WorkEvents.taskDeleted, { async: true, promisify: true })
  onTaskDeleted(event: TaskDeleted): Promise<void> {
    return this.unlink(event.ownerId, event.taskId);
  }

  @OnEvent(WorkEvents.projectDeleted, { async: true, promisify: true })
  onProjectDeleted(event: ProjectDeleted): Promise<void> {
    return this.unlink(event.ownerId, event.projectId);
  }

  private unlink(ownerId: string, workItemId: string): Promise<void> {
    return this.uow.run(async () => {
      for (const note of await this.notes.linkedTo(ownerId, workItemId)) {
        if (note.unlink(workItemId)) await this.notes.save(note);
      }
      for (const snippet of await this.snippets.linkedTo(ownerId, workItemId)) {
        if (snippet.unlink(workItemId)) await this.snippets.save(snippet);
      }
    });
  }
}
