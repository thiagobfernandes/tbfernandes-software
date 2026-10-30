package com.tbfernandes.api.contacts.adapter.in.web;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.contacts.application.ContactService;
import com.tbfernandes.api.contacts.domain.Contact;
import com.tbfernandes.api.contacts.domain.Interaction;
import com.tbfernandes.api.shared.infrastructure.web.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Contacts and interactions. Bodies match web/src/features/contacts/types/contact.ts. */
@RestController
@RequestMapping("/api/v1")
class ContactController {

	private final ContactService service;

	ContactController(ContactService service) {
		this.service = service;
	}

	@GetMapping("/contacts")
	List<Resource<Contact.Details>> contacts(@RequestParam(required = false) Integer dueWithinDays) {
		return service.contacts(dueWithinDays).stream().map(Resource::of).toList();
	}

	@GetMapping("/contacts/{id}")
	Resource<Contact.Details> contact(@PathVariable UUID id) {
		return Resource.of(service.contact(id));
	}

	@PostMapping("/contacts")
	ResponseEntity<Resource<Contact.Details>> createContact(@RequestBody Contact.Details body) {
		Contact contact = service.createContact(body);
		return ResponseEntity.created(URI.create("/api/v1/contacts/" + contact.id())).body(Resource.of(contact));
	}

	@PutMapping("/contacts/{id}")
	Resource<Contact.Details> updateContact(@PathVariable UUID id, @RequestBody Contact.Details body) {
		return Resource.of(service.updateContact(id, body));
	}

	@DeleteMapping("/contacts/{id}")
	ResponseEntity<Void> deleteContact(@PathVariable UUID id) {
		service.deleteContact(id);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/interactions")
	List<Resource<Interaction.Details>> interactions(@RequestParam(required = false) UUID contactId) {
		return service.interactions(contactId).stream().map(Resource::of).toList();
	}

	@PostMapping("/interactions")
	ResponseEntity<Resource<Interaction.Details>> createInteraction(@RequestBody Interaction.Details body) {
		Interaction interaction = service.createInteraction(body);
		return ResponseEntity.created(URI.create("/api/v1/interactions/" + interaction.id()))
			.body(Resource.of(interaction));
	}

	@PutMapping("/interactions/{id}")
	Resource<Interaction.Details> updateInteraction(@PathVariable UUID id, @RequestBody Interaction.Details body) {
		return Resource.of(service.updateInteraction(id, body));
	}

	@DeleteMapping("/interactions/{id}")
	ResponseEntity<Void> deleteInteraction(@PathVariable UUID id) {
		service.deleteInteraction(id);
		return ResponseEntity.noContent().build();
	}

	/** CTC-03. title is optional ("Follow up with <name>"). */
	@PostMapping("/interactions/{id}/follow-up")
	Resource<Interaction.Details> followUp(@PathVariable UUID id, @RequestBody FollowUpRequest body) {
		return Resource.of(service.createFollowUp(id, body.title(), body.dueDate()));
	}

	record FollowUpRequest(String title, LocalDate dueDate) {
	}

}
