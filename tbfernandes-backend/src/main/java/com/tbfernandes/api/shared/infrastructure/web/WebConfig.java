package com.tbfernandes.api.shared.infrastructure.web;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.core.convert.converter.ConverterFactory;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web settings shared by all modules: CORS for the Next.js frontend (tbf.cors.allowed-origins)
 * and enum query parameters written as the frontend writes them ("in_progress").
 */
@Configuration(proxyBeanMethods = false)
class WebConfig implements WebMvcConfigurer {

	private final CorsProperties properties;

	WebConfig(CorsProperties properties) {
		this.properties = properties;
	}

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry.addMapping("/api/**")
			.allowedOrigins(properties.allowedOrigins().toArray(String[]::new))
			.allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE")
			// Paging totals and the new resource's URL are read by the frontend (PLT-09).
			.exposedHeaders("X-Total-Count", "X-Page", "X-Page-Size", "Location")
			.allowCredentials(true);
	}

	@Override
	public void addFormatters(FormatterRegistry registry) {
		registry.addConverterFactory(new LowercaseEnumConverterFactory());
	}

	@ConfigurationProperties("tbf.cors")
	record CorsProperties(List<String> allowedOrigins) {
	}

	@SuppressWarnings({ "rawtypes", "unchecked" })
	static final class LowercaseEnumConverterFactory implements ConverterFactory<String, Enum> {

		@Override
		public <T extends Enum> Converter<String, T> getConverter(Class<T> targetType) {
			return source -> source.isBlank() ? null : (T) Enum.valueOf(targetType, source.strip().toUpperCase());
		}

	}

}
