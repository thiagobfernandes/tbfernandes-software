package com.tbfernandes.api.work.domain.task;

import java.util.UUID;

import com.tbfernandes.api.shared.domain.Ids;
import com.tbfernandes.api.shared.domain.Require;

public record ChecklistItem(UUID id, String title, boolean done) {

	public ChecklistItem {
		id = id == null ? Ids.newId() : id;
		title = Require.text(title, "checklist item title", 200);
	}

}
