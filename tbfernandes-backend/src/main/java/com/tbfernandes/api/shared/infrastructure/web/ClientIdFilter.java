package com.tbfernandes.api.shared.infrastructure.web;

import java.io.IOException;
import java.util.UUID;

import com.tbfernandes.api.shared.domain.ClientIds;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * ADR-007: on a POST, {@code X-Client-Id: <uuid>} sets the id of the record the request creates.
 * Without the header the server picks the id, as before.
 */
@Component
class ClientIdFilter extends OncePerRequestFilter {

	static final String HEADER = "X-Client-Id";

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		String header = request.getHeader(HEADER);
		if (header == null || !"POST".equals(request.getMethod())) {
			chain.doFilter(request, response);
			return;
		}
		UUID id;
		try {
			id = UUID.fromString(header.strip());
		}
		catch (IllegalArgumentException ex) {
			response.setStatus(HttpStatus.BAD_REQUEST.value());
			response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
			response.getWriter().write("{\"status\":400,\"detail\":\"" + HEADER + " must be a UUID\"}");
			return;
		}
		ClientIds.request(id);
		try {
			chain.doFilter(request, response);
		}
		finally {
			ClientIds.clear();
		}
	}

}
