package com.tbfernandes.api.contacts.application;

import java.time.Clock;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.contacts.ContactsLookup;
import com.tbfernandes.api.contacts.domain.Contact;
import com.tbfernandes.api.contacts.domain.ContactRepository;
import com.tbfernandes.api.contacts.domain.Interaction;
import com.tbfernandes.api.shared.application.OwnerContext;
import com.tbfernandes.api.shared.domain.NotFound;
import com.tbfernandes.api.work.FollowUpTasks;
import com.tbfernandes.api.work.WorkLookup;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Contacts and interactions (RF-CTC-01..04). Talks to work only through its public API. */
@Service
@Transactional
public class ContactService implements ContactsLookup {

	private final ContactRepository repository;
	private final WorkLookup work;
	private final FollowUpTasks followUps;
	private final OwnerContext owner;
	private final Clock clock;

	ContactService(ContactRepository repository, WorkLookup work, FollowUpTasks followUps, OwnerContext owner,
			Clock clock) {
		this.repository = repository;
		this.work = work;
		this.followUps = followUps;
		this.owner = owner;
		this.clock = clock;
	}

	public Contact createContact(Contact.Details details) {
		checkCompany(details.companyId());
		return repository.save(Contact.create(owner.currentOwnerId(), details));
	}

	public Contact updateContact(UUID id, Contact.Details details) {
		Contact contact = contact(id);
		checkCompany(details.companyId());
		contact.update(details);
		return repository.save(contact);
	}

	public void deleteContact(UUID id) {
		repository.delete(contact(id));
	}

	@Transactional(readOnly = true)
	public Contact contact(UUID id) {
		return repository.findContact(owner.currentOwnerId(), id).orElseThrow(() -> new NotFound("Contact", id));
	}

	/** CTC-04: dueWithinDays keeps contacts whose next contact is overdue or within the window. */
	@Transactional(readOnly = true)
	public List<Contact> contacts(Integer dueWithinDays) {
		List<Contact> all = repository.findContacts(owner.currentOwnerId());
		if (dueWithinDays == null) {
			return all;
		}
		LocalDate limit = LocalDate.now(clock).plusDays(dueWithinDays);
		return all.stream()
			.filter(c -> c.details().nextContact() != null && !c.details().nextContact().isAfter(limit))
			.sorted(Comparator.comparing(c -> c.details().nextContact()))
			.toList();
	}

	public Interaction createInteraction(Interaction.Details details) {
		contact(details.contactId());
		checkTask(details.followUpTaskId());
		return repository.save(Interaction.create(owner.currentOwnerId(), details));
	}

	public Interaction updateInteraction(UUID id, Interaction.Details details) {
		Interaction interaction = interaction(id);
		contact(details.contactId());
		checkTask(details.followUpTaskId());
		interaction.update(details);
		return repository.save(interaction);
	}

	public void deleteInteraction(UUID id) {
		repository.delete(interaction(id));
	}

	@Transactional(readOnly = true)
	public Interaction interaction(UUID id) {
		return repository.findInteraction(owner.currentOwnerId(), id)
			.orElseThrow(() -> new NotFound("Interaction", id));
	}

	@Transactional(readOnly = true)
	public List<Interaction> interactions(UUID contactId) {
		return repository.findInteractions(owner.currentOwnerId(), contactId);
	}

	/** CTC-03: creates a "todo" task in work and records it on the interaction. */
	public Interaction createFollowUp(UUID interactionId, String title, LocalDate dueDate) {
		Interaction interaction = interaction(interactionId);
		Contact contact = contact(interaction.details().contactId());
		String taskTitle = title == null || title.isBlank() ? "Follow up with " + contact.details().name() : title;
		UUID taskId = followUps.create(taskTitle, interaction.details().summary(), dueDate);
		interaction.followUpCreated(taskId);
		return repository.save(interaction);
	}

	@Override
	@Transactional(readOnly = true)
	public List<ContactView> contacts(UUID ownerId) {
		return repository.findContacts(ownerId)
			.stream()
			.map(c -> new ContactView(c.id(), c.details().name(), c.details().companyId(), c.details().companyName(),
					c.details().nextContact()))
			.toList();
	}

	private void checkCompany(UUID companyId) {
		if (companyId != null && !work.companyExists(owner.currentOwnerId(), companyId)) {
			throw new NotFound("Company", companyId);
		}
	}

	private void checkTask(UUID taskId) {
		if (taskId != null && !work.taskExists(owner.currentOwnerId(), taskId)) {
			throw new NotFound("Task", taskId);
		}
	}

}
