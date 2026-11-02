package com.tbfernandes.api.identity.infrastructure.security;

import com.tbfernandes.api.identity.application.AuthProperties;
import com.tbfernandes.api.identity.domain.AppUserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import tools.jackson.databind.json.JsonMapper;

/**
 * IDN-01. Session mode: cookie session (HttpOnly, SameSite=Lax) plus CSRF token in the
 * XSRF-TOKEN cookie, sent back by the frontend in X-XSRF-TOKEN. Single-user mode keeps the
 * API open for local development, as in the earlier stages.
 */
@Configuration(proxyBeanMethods = false)
class SecurityConfig {

	@Bean
	SecurityFilterChain api(HttpSecurity http, AuthProperties properties, JsonMapper json) throws Exception {
		http.cors(Customizer.withDefaults());
		if (!properties.sessionMode()) {
			return http.csrf(csrf -> csrf.disable())
				.authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
				.build();
		}
		// Webhooks come from outside with no session; each controller checks its own secret.
		return http.csrf(csrf -> csrf.spa().ignoringRequestMatchers("/api/v1/webhooks/**"))
			.authorizeHttpRequests(auth -> auth
				.requestMatchers("/api/v1/auth/**", "/api/v1/webhooks/**", "/actuator/health", "/v3/api-docs/**", "/swagger-ui/**",
						"/swagger-ui.html")
				.permitAll()
				.anyRequest()
				.authenticated())
			.exceptionHandling(errors -> errors.authenticationEntryPoint((request, response, ex) -> {
				ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Entre primeiro");
				response.setStatus(401);
				response.setContentType("application/problem+json");
				json.writeValue(response.getOutputStream(), problem);
			}))
			.formLogin(form -> form.disable())
			.httpBasic(basic -> basic.disable())
			.logout(logout -> logout.disable())
			.build();
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return PasswordEncoderFactories.createDelegatingPasswordEncoder();
	}

	@Bean
	UserDetailsService userDetailsService(AppUserRepository users) {
		return email -> users.findByEmail(email)
			.filter(user -> user.canLogIn())
			.map(user -> new OwnerPrincipal(user.id(), user.profile().email(), user.passwordHash()))
			.orElseThrow(() -> new UsernameNotFoundException("Unknown account"));
	}

	@Bean
	AuthenticationManager authenticationManager(UserDetailsService users, PasswordEncoder passwords) {
		DaoAuthenticationProvider provider = new DaoAuthenticationProvider(users);
		provider.setPasswordEncoder(passwords);
		return new ProviderManager(provider);
	}

	@Bean
	SecurityContextRepository securityContextRepository() {
		return new HttpSessionSecurityContextRepository();
	}

}
