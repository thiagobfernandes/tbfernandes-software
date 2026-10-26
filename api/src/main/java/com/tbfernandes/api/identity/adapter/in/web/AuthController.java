package com.tbfernandes.api.identity.adapter.in.web;

import java.util.Map;

import com.tbfernandes.api.identity.application.AuthProperties;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Login and logout for session mode (IDN-01). */
@RestController
@RequestMapping("/api/v1/auth")
class AuthController {

	private final AuthenticationManager authentication;
	private final SecurityContextRepository contexts;
	private final AuthProperties properties;

	AuthController(AuthenticationManager authentication, SecurityContextRepository contexts,
			AuthProperties properties) {
		this.authentication = authentication;
		this.contexts = contexts;
		this.properties = properties;
	}

	/** Tells the frontend whether to show the login screen, and sets the CSRF cookie. */
	@GetMapping("/session")
	Map<String, Object> session(CsrfToken csrf, Authentication current) {
		if (csrf != null) {
			csrf.getToken();
		}
		return Map.of("mode", properties.mode().name().toLowerCase().replace('_', '-'), "signedIn",
				current != null && current.isAuthenticated() && !"anonymousUser".equals(current.getPrincipal()));
	}

	@PostMapping("/login")
	ResponseEntity<Void> login(@Valid @RequestBody LoginRequest body, HttpServletRequest request,
			HttpServletResponse response) {
		Authentication result = authentication
			.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(body.email(), body.password()));
		if (request.getSession(false) != null) {
			// Session fixation: an existing session gets a new id once the user signs in.
			request.changeSessionId();
		}
		SecurityContext context = SecurityContextHolder.createEmptyContext();
		context.setAuthentication(result);
		SecurityContextHolder.setContext(context);
		contexts.saveContext(context, request, response);
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/logout")
	ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response, Authentication current) {
		new SecurityContextLogoutHandler().logout(request, response, current);
		return ResponseEntity.noContent().build();
	}

	/** Same answer for unknown e-mail and wrong password, so accounts cannot be probed. */
	@ExceptionHandler(AuthenticationException.class)
	ProblemDetail badCredentials() {
		return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "E-mail or password is wrong");
	}

	record LoginRequest(@NotBlank String email, @NotBlank String password) {
	}

}
