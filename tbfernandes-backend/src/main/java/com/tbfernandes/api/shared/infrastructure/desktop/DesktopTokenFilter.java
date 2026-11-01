package com.tbfernandes.api.shared.infrastructure.desktop;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * A backend on 127.0.0.1 can be called by any web page open in the user's browser. Only the
 * desktop app knows the launch token, so every request without it gets 401. CORS preflights
 * carry no custom headers and pass; the request that follows them is checked.
 */
final class DesktopTokenFilter extends OncePerRequestFilter {

	static final String HEADER = "X-TBF-Desktop-Token";

	private final byte[] token;

	DesktopTokenFilter(String token) {
		this.token = token.getBytes(StandardCharsets.UTF_8);
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		if (HttpMethod.OPTIONS.matches(request.getMethod()) || matches(request.getHeader(HEADER))) {
			chain.doFilter(request, response);
			return;
		}
		response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
		response.setContentType("application/problem+json");
		response.setCharacterEncoding(StandardCharsets.UTF_8.name());
		response.getWriter().write("{\"status\":401,\"title\":\"Unauthorized\",\"detail\":\"Token do aplicativo ausente ou inválido\"}");
	}

	private boolean matches(String header) {
		return header != null && MessageDigest.isEqual(token, header.getBytes(StandardCharsets.UTF_8));
	}

}
