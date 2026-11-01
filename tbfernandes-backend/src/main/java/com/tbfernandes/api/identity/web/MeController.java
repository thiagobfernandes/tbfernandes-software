package com.tbfernandes.api.identity.web;

import com.tbfernandes.api.identity.application.ProfileService;
import com.tbfernandes.api.identity.domain.AppUser;
import com.tbfernandes.api.identity.protocols.MeResponse;
import com.tbfernandes.api.identity.protocols.PasswordRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The signed-in user's profile and password (IDN-03). */
@RestController
@RequestMapping("/api/v1/me")
class MeController {

	private final ProfileService service;

	MeController(ProfileService service) {
		this.service = service;
	}

	@GetMapping
	MeResponse me() {
		return MeResponse.from(service.me());
	}

	@PutMapping
	MeResponse update(@RequestBody AppUser.Profile body) {
		return MeResponse.from(service.updateProfile(body));
	}

	@PutMapping("/password")
	ResponseEntity<Void> changePassword(@RequestBody PasswordRequest body) {
		service.changePassword(body.current(), body.next());
		return ResponseEntity.noContent().build();
	}

}
