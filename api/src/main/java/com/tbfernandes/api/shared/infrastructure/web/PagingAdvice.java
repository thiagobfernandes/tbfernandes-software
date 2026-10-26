package com.tbfernandes.api.shared.infrastructure.web;

import java.util.List;

import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

/**
 * PLT-09: every list endpoint accepts {@code page} (from 0) and {@code size} (1..200, default 50).
 * Without {@code page} the whole list comes back, which is what the frontend uses today.
 * Totals go in headers (X-Total-Count, X-Page, X-Page-Size) so the body keeps its shape.
 * <p>
 * The slice is taken after the query, which is fine at one user's volume; a module whose
 * lists grow large should page in SQL instead.
 */
@RestControllerAdvice
class PagingAdvice implements ResponseBodyAdvice<Object> {

	static final int DEFAULT_SIZE = 50;

	static final int MAX_SIZE = 200;

	@Override
	public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
		return List.class.isAssignableFrom(returnType.getParameterType());
	}

	@Override
	public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType contentType,
			Class<? extends HttpMessageConverter<?>> converterType, ServerHttpRequest request,
			ServerHttpResponse response) {
		if (!(body instanceof List<?> list) || !(request instanceof ServletServerHttpRequest servlet)) {
			return body;
		}
		String pageParam = servlet.getServletRequest().getParameter("page");
		if (pageParam == null) {
			return body;
		}
		int page = Math.max(0, parse(pageParam, 0));
		int size = Math.clamp(parse(servlet.getServletRequest().getParameter("size"), DEFAULT_SIZE), 1, MAX_SIZE);
		response.getHeaders().set("X-Total-Count", String.valueOf(list.size()));
		response.getHeaders().set("X-Page", String.valueOf(page));
		response.getHeaders().set("X-Page-Size", String.valueOf(size));
		long from = Math.min((long) page * size, list.size());
		return list.subList((int) from, (int) Math.min(from + size, list.size()));
	}

	private static int parse(String value, int fallback) {
		try {
			return value == null ? fallback : Integer.parseInt(value);
		}
		catch (NumberFormatException ex) {
			throw new IllegalArgumentException("page and size must be numbers");
		}
	}

}
