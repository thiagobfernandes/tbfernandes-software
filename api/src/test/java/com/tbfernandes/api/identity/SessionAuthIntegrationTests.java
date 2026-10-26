package com.tbfernandes.api.identity;

import java.util.UUID;

import com.tbfernandes.api.ApiTestSupport;
import com.tbfernandes.api.identity.domain.AppUser;
import com.tbfernandes.api.identity.domain.AppUserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

@TestPropertySource(properties = { "tbf.auth.mode=session", "tbf.auth.bootstrap.email=owner@tbfernandes.local",
		"tbf.auth.bootstrap.password=correct horse battery" })
class SessionAuthIntegrationTests extends ApiTestSupport {

	@Autowired
	AppUserRepository users;

	@Autowired
	PasswordEncoder passwords;

	private MockHttpSession login(String email, String password) {
		MvcTestResult result = mvc.post()
			.uri("/api/v1/auth/login")
			.with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"email\": \"%s\", \"password\": \"%s\"}".formatted(email, password))
			.exchange();
		assertThat(result).hasStatus(204);
		return (MockHttpSession) result.getRequest().getSession(false);
	}

	@Test
	void apiNeedsASessionAndLoginNeedsTheCsrfToken() {
		assertThat(mvc.get().uri("/api/v1/companies")).hasStatus(401);
		assertThat(mvc.post()
			.uri("/api/v1/auth/login")
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"email\": \"owner@tbfernandes.local\", \"password\": \"correct horse battery\"}"))
			.hasStatus(403);
		assertThat(mvc.post()
			.uri("/api/v1/auth/login")
			.with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"email\": \"owner@tbfernandes.local\", \"password\": \"wrong\"}")).hasStatus(401);

		MockHttpSession session = login("owner@tbfernandes.local", "correct horse battery");
		assertThat(mvc.get().uri("/api/v1/me").session(session)).hasStatusOk()
			.bodyJson()
			.hasPathSatisfying("$.email", email -> assertThat(email).isEqualTo("owner@tbfernandes.local"));
		assertThat(mvc.get().uri("/api/v1/auth/session").session(session)).bodyJson()
			.hasPathSatisfying("$.mode", mode -> assertThat(mode).isEqualTo("session"));
	}

	@Test
	void ownersNeverSeeEachOthersData() {
		AppUser other = AppUser.create(UUID.randomUUID(),
				new AppUser.Profile("Other", "other@example.com", null, null));
		other.changePasswordHash(passwords.encode("another long password"));
		users.save(other);

		MockHttpSession otherSession = login("other@example.com", "another long password");
		MvcTestResult created = mvc.post()
			.uri("/api/v1/companies")
			.session(otherSession)
			.with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"name\": \"Private\", \"relationship\": \"own\", \"startDate\": \"2026-01-01\"}")
			.exchange();
		assertThat(created).hasStatus(201);
		String companyId = read(created, "$.id");

		MockHttpSession ownerSession = login("owner@tbfernandes.local", "correct horse battery");
		assertThat(mvc.get().uri("/api/v1/companies/{id}", companyId).session(ownerSession)).hasStatus(404);
		assertThat(mvc.get().uri("/api/v1/companies/{id}", companyId).session(otherSession)).hasStatusOk();
	}

}
