package com.tbfernandes.api.shared.infrastructure.desktop;

import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Called by the Windows app when its window closes, so PostgreSQL stops cleanly. */
@RestController
@RequestMapping("/api/v1/desktop")
@Profile("desktop")
class DesktopController {

	private final ConfigurableApplicationContext context;

	DesktopController(ConfigurableApplicationContext context) {
		this.context = context;
	}

	@PostMapping("/shutdown")
	ResponseEntity<Void> shutdown() {
		DesktopConfig.exit(context);
		return ResponseEntity.accepted().build();
	}

}
