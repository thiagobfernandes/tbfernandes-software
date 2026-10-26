package com.tbfernandes.api.contacts;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Read access to contacts for other modules (assistant). */
public interface ContactsLookup {

	List<ContactView> contacts(UUID ownerId);

	record ContactView(UUID id, String name, String role, UUID companyId, String companyName, LocalDate nextContact) {
	}

}
