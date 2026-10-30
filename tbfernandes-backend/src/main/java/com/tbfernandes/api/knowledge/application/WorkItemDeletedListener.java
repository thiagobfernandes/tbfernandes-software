package com.tbfernandes.api.knowledge.application;

import java.util.UUID;

import com.tbfernandes.api.knowledge.domain.note.NoteRepository;
import com.tbfernandes.api.knowledge.domain.snippet.SnippetRepository;
import com.tbfernandes.api.work.ProjectDeleted;
import com.tbfernandes.api.work.TaskDeleted;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

/**
 * KNW-06: when a project or task is deleted, notes and snippets drop the link and stay.
 * Runs after the work transaction commits, in its own transaction, retried by Modulith.
 */
@Component
class WorkItemDeletedListener {

	private final NoteRepository notes;
	private final SnippetRepository snippets;

	WorkItemDeletedListener(NoteRepository notes, SnippetRepository snippets) {
		this.notes = notes;
		this.snippets = snippets;
	}

	@ApplicationModuleListener
	void on(TaskDeleted event) {
		unlink(event.ownerId(), event.taskId());
	}

	@ApplicationModuleListener
	void on(ProjectDeleted event) {
		unlink(event.ownerId(), event.projectId());
	}

	private void unlink(UUID ownerId, UUID workItemId) {
		notes.linkedTo(ownerId, workItemId).forEach(note -> {
			if (note.unlink(workItemId)) {
				notes.save(note);
			}
		});
		snippets.linkedTo(ownerId, workItemId).forEach(snippet -> {
			if (snippet.unlink(workItemId)) {
				snippets.save(snippet);
			}
		});
	}

}
