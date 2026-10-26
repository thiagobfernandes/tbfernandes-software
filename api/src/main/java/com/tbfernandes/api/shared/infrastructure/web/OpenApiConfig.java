package com.tbfernandes.api.shared.infrastructure.web;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** PLT-12: title and description of the contract the frontend types are generated from. */
@Configuration(proxyBeanMethods = false)
class OpenApiConfig {

	@Bean
	OpenAPI tbfOpenApi() {
		return new OpenAPI().info(new Info().title("TBFernandes Software API")
			.version("v1")
			.description("Personal and professional management platform. Errors use RFC 9457 Problem Details; "
					+ "enums are lower case, as in the frontend types."));
	}

}
