package com.tbfernandes.api.contacts.domain;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import com.tbfernandes.api.shared.domain.Aggregate;
import com.tbfernandes.api.shared.domain.BusinessRuleViolation;
import com.tbfernandes.api.shared.domain.Ids;
import com.tbfernandes.api.shared.domain.Require;

/**
 * A person in the professional network (RF-CTC-01). Linked to a registered company or, for
 * organizations not registered, just its name; never both (RN-23).
 */
public final class Contact extends Aggregate<Contact.Details> {

	private Contact(UUID id, UUID ownerId, Details details, boolean validate) {
		super(id, ownerId, details, validate);
	}

	public static Contact create(UUID ownerId, Details details) {
		return new Contact(Ids.newId(), ownerId, details, true);
	}

	public static Contact restore(UUID id, UUID ownerId, Details details) {
		return new Contact(id, ownerId, details, false);
	}

	@Override
	protected Details validate(Details d) {
		String companyName = Require.optionalText(d.companyName(), "companyName", 120);
		if (d.companyId() != null && companyName != null) {
			throw new BusinessRuleViolation("RN-23", "Use either a registered company or a company name");
		}
		String email = Require.optionalText(d.email(), "email", 254);
		if (email != null && !email.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")) {
			throw new IllegalArgumentException("email is not valid");
		}
		List<String> specialties = d.specialties() == null ? List.of()
				: d.specialties().stream().filter(s -> s != null && !s.isBlank()).map(String::strip).distinct().toList();
		return new Details(Require.text(d.name(), "name", 120), d.companyId(), companyName,
				Require.optionalText(d.role(), "role", 120), email == null ? null : email.toLowerCase(Locale.ROOT),
				Require.optionalText(d.phone(), "phone", 40), Require.optionalText(d.profileUrl(), "profileUrl", 2000),
				specialties, Require.optionalText(d.context(), "context", 2000), d.nextContact(),
				Require.optionalText(d.notes(), "notes", 5000));
	}

	/** The registered company was deleted: keep the contact, drop the link. */
	public void companyDeleted() {
		Details d = details();
		update(new Details(d.name(), null, d.companyName(), d.role(), d.email(), d.phone(), d.profileUrl(),
				d.specialties(), d.context(), d.nextContact(), d.notes()));
	}

	public record Details(String name, UUID companyId, String companyName, String role, String email, String phone,
			String profileUrl, List<String> specialties, String context, LocalDate nextContact, String notes) {
	}

}
