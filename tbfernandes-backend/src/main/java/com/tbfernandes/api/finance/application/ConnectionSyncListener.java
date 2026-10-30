package com.tbfernandes.api.finance.application;

import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

/** FIN-OF-05: runs the syncs that registrations and webhooks ask for. */
@Component
class ConnectionSyncListener {

	private final OpenFinanceService service;

	ConnectionSyncListener(OpenFinanceService service) {
		this.service = service;
	}

	@ApplicationModuleListener
	void on(ConnectionSyncRequested event) {
		service.syncRequested(event);
	}

}
