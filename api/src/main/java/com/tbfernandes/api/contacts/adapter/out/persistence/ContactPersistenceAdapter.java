package com.tbfernandes.api.contacts.adapter.out.persistence;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.tbfernandes.api.contacts.domain.Contact;
import com.tbfernandes.api.contacts.domain.ContactRepository;
import com.tbfernandes.api.contacts.domain.Interaction;
import com.tbfernandes.api.contacts.domain.InteractionKind;
import com.tbfernandes.api.shared.infrastructure.persistence.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;

@Component
class ContactPersistenceAdapter implements ContactRepository {

	private final ContactJpa contacts;
	private final InteractionJpa interactions;

	ContactPersistenceAdapter(ContactJpa contacts, InteractionJpa interactions) {
		this.contacts = contacts;
		this.interactions = interactions;
	}

	@Override
	public Contact save(Contact contact) {
		ContactEntity e = contacts.findById(contact.id()).orElseGet(ContactEntity::new);
		e.id = contact.id();
		e.ownerId = contact.ownerId();
		Contact.Details d = contact.details();
		e.name = d.name();
		e.companyId = d.companyId();
		e.companyName = d.companyName();
		e.role = d.role();
		e.email = d.email();
		e.phone = d.phone();
		e.profileUrl = d.profileUrl();
		e.specialties = d.specialties().toArray(String[]::new);
		e.context = d.context();
		e.nextContact = d.nextContact();
		e.notes = d.notes();
		return toDomain(contacts.save(e));
	}

	@Override
	public Optional<Contact> findContact(UUID ownerId, UUID id) {
		return contacts.findByOwnerIdAndId(ownerId, id).map(ContactPersistenceAdapter::toDomain);
	}

	@Override
	public List<Contact> findContacts(UUID ownerId) {
		return contacts.findByOwnerId(ownerId, Sort.by("name")).stream().map(ContactPersistenceAdapter::toDomain).toList();
	}

	@Override
	public List<Contact> findByCompany(UUID ownerId, UUID companyId) {
		return contacts.findByOwnerIdAndCompanyId(ownerId, companyId)
			.stream()
			.map(ContactPersistenceAdapter::toDomain)
			.toList();
	}

	@Override
	public void delete(Contact contact) {
		contacts.deleteById(contact.id());
	}

	@Override
	public Interaction save(Interaction interaction) {
		InteractionEntity e = interactions.findById(interaction.id()).orElseGet(InteractionEntity::new);
		e.id = interaction.id();
		e.ownerId = interaction.ownerId();
		Interaction.Details d = interaction.details();
		e.contactId = d.contactId();
		e.occurredOn = d.date();
		e.kind = d.kind();
		e.summary = d.summary();
		e.followUpTaskId = d.followUpTaskId();
		return toDomain(interactions.save(e));
	}

	@Override
	public Optional<Interaction> findInteraction(UUID ownerId, UUID id) {
		return interactions.findByOwnerIdAndId(ownerId, id).map(ContactPersistenceAdapter::toDomain);
	}

	@Override
	public List<Interaction> findInteractions(UUID ownerId, UUID contactId) {
		Sort newest = Sort.by(Sort.Direction.DESC, "occurredOn");
		List<InteractionEntity> rows = contactId == null ? interactions.findByOwnerId(ownerId, newest)
				: interactions.findByOwnerIdAndContactId(ownerId, contactId, newest);
		return rows.stream().map(ContactPersistenceAdapter::toDomain).toList();
	}

	@Override
	public List<Interaction> findByFollowUpTask(UUID ownerId, UUID taskId) {
		return interactions.findByOwnerIdAndFollowUpTaskId(ownerId, taskId)
			.stream()
			.map(ContactPersistenceAdapter::toDomain)
			.toList();
	}

	@Override
	public void delete(Interaction interaction) {
		interactions.deleteById(interaction.id());
	}

	private static Contact toDomain(ContactEntity e) {
		return Contact.restore(e.id, e.ownerId,
				new Contact.Details(e.name, e.companyId, e.companyName, e.role, e.email, e.phone, e.profileUrl,
						e.specialties == null ? List.of() : Arrays.asList(e.specialties), e.context, e.nextContact,
						e.notes));
	}

	private static Interaction toDomain(InteractionEntity e) {
		return Interaction.restore(e.id, e.ownerId,
				new Interaction.Details(e.contactId, e.occurredOn, e.kind, e.summary, e.followUpTaskId));
	}

	@Entity
	@Table(schema = "contacts", name = "contact")
	static class ContactEntity extends AuditedEntity {

		String name;

		UUID companyId;

		String companyName;

		String role;

		String email;

		String phone;

		String profileUrl;

		@JdbcTypeCode(SqlTypes.ARRAY)
		String[] specialties;

		String context;

		LocalDate nextContact;

		String notes;

	}

	@Entity
	@Table(schema = "contacts", name = "interaction")
	static class InteractionEntity extends AuditedEntity {

		UUID contactId;

		@Column(name = "occurred_on")
		LocalDate occurredOn;

		@Enumerated(EnumType.STRING)
		InteractionKind kind;

		String summary;

		UUID followUpTaskId;

	}

}

interface ContactJpa extends JpaRepository<ContactPersistenceAdapter.ContactEntity, UUID> {

	Optional<ContactPersistenceAdapter.ContactEntity> findByOwnerIdAndId(UUID ownerId, UUID id);

	List<ContactPersistenceAdapter.ContactEntity> findByOwnerId(UUID ownerId, Sort sort);

	List<ContactPersistenceAdapter.ContactEntity> findByOwnerIdAndCompanyId(UUID ownerId, UUID companyId);

}

interface InteractionJpa extends JpaRepository<ContactPersistenceAdapter.InteractionEntity, UUID> {

	Optional<ContactPersistenceAdapter.InteractionEntity> findByOwnerIdAndId(UUID ownerId, UUID id);

	List<ContactPersistenceAdapter.InteractionEntity> findByOwnerId(UUID ownerId, Sort sort);

	List<ContactPersistenceAdapter.InteractionEntity> findByOwnerIdAndContactId(UUID ownerId, UUID contactId,
			Sort sort);

	List<ContactPersistenceAdapter.InteractionEntity> findByOwnerIdAndFollowUpTaskId(UUID ownerId, UUID taskId);

}
