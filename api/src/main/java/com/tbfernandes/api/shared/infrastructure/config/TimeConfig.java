package com.tbfernandes.api.shared.infrastructure.config;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** One clock for the whole app, so tests can fix "today". */
@Configuration(proxyBeanMethods = false)
class TimeConfig {

	@Bean
	Clock clock() {
		return Clock.systemDefaultZone();
	}

}
