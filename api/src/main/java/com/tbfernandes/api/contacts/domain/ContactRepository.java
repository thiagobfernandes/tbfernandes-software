package com.tbfernandes.api.contacts.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Output port for contacts and interactions. */
public interface ContactRepository {

	Contact save(Contact contact);

	Optional<Contact> findContact(UUID ownerId, UUID id);

	List<Contact> findContacts(UUID ownerId);

	List<Contact> findByCompany(UUID ownerId, UUID companyId);

	/** Interactions go with the contact (RN-10, ON DELETE CASCADE). */
	void delete(Contact contact);

	Interaction save(Interaction interaction);

	Optional<Interaction> findInteraction(UUID ownerId, UUID id);

	List<Interaction> findInteractions(UUID ownerId, UUID contactId);

	List<Interaction> findByFollowUpTask(UUID ownerId, UUID taskId);

	void delete(Interaction interaction);

}
