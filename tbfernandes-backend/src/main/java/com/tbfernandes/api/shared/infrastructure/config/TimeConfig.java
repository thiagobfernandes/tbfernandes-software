package com.tbfernandes.api.shared.infrastructure.config;

import java.time.Clock;
import java.time.ZoneId;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * One clock for the whole app, in the user's time zone (tbf.time-zone), so "today" and
 * "this week" match what the user sees. Tests can replace it to fix "today".
 */
@Configuration(proxyBeanMethods = false)
class TimeConfig {

	@Bean
	Clock clock(@Value("${tbf.time-zone:America/Sao_Paulo}") String zone) {
		return Clock.system(ZoneId.of(zone));
	}

}
