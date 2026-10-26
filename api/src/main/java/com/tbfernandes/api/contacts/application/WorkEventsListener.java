package com.tbfernandes.api.contacts.application;

import com.tbfernandes.api.contacts.domain.ContactRepository;
import com.tbfernandes.api.work.CompanyDeleted;
import com.tbfernandes.api.work.TaskDeleted;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

/** Keeps contacts consistent when work items they point to are deleted (RN-01). */
@Component
class WorkEventsListener {

	private final ContactRepository repository;

	WorkEventsListener(ContactRepository repository) {
		this.repository = repository;
	}

	@ApplicationModuleListener
	void on(CompanyDeleted event) {
		repository.findByCompany(event.ownerId(), event.companyId()).forEach(contact -> {
			contact.companyDeleted();
			repository.save(contact);
		});
	}

	@ApplicationModuleListener
	void on(TaskDeleted event) {
		repository.findByFollowUpTask(event.ownerId(), event.taskId()).forEach(interaction -> {
			interaction.followUpDeleted();
			repository.save(interaction);
		});
	}

}
