package com.tbfernandes.api.finance.web;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.finance.application.OpenFinanceService;
import com.tbfernandes.api.finance.domain.BankConnection;
import com.tbfernandes.api.finance.protocols.Availability;
import com.tbfernandes.api.finance.protocols.ConnectTokenResponse;
import com.tbfernandes.api.finance.protocols.RegisterRequest;
import com.tbfernandes.api.finance.protocols.SyncResponse;
import com.tbfernandes.api.finance.protocols.TokenRequest;
import com.tbfernandes.api.shared.protocols.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Bank connections (epic FIN-OF). Bodies match web/src/features/finance/types/connections.ts. */
@RestController
@RequestMapping("/api/v1/finance/connections")
class OpenFinanceController {

	private final OpenFinanceService service;

	OpenFinanceController(OpenFinanceService service) {
		this.service = service;
	}

	@GetMapping("/availability")
	Availability availability() {
		return new Availability(service.enabled());
	}

	@GetMapping
	List<Resource<BankConnection.Details>> connections() {
		return service.connections().stream().map(Resource::of).toList();
	}

	@PostMapping("/token")
	ConnectTokenResponse token(@RequestBody TokenRequest body) {
		return new ConnectTokenResponse(service.connectToken(body.scope()).accessToken(), null);
	}

	@PostMapping("/{id}/token")
	ConnectTokenResponse reconnectToken(@PathVariable UUID id) {
		return new ConnectTokenResponse(service.reconnectToken(id).accessToken(),
				service.connection(id).externalId());
	}

	@PostMapping
	ResponseEntity<Resource<BankConnection.Details>> register(@RequestBody RegisterRequest body) {
		BankConnection connection = service.register(body.itemId(), body.scope());
		return ResponseEntity.created(URI.create("/api/v1/finance/connections/" + connection.id()))
			.body(Resource.of(connection));
	}

	@PostMapping("/{id}/sync")
	SyncResponse sync(@PathVariable UUID id) {
		OpenFinanceService.SyncResult result = service.sync(id);
		return new SyncResponse(result.imported(), Resource.of(result.connection()));
	}

	@DeleteMapping("/{id}")
	ResponseEntity<Void> disconnect(@PathVariable UUID id) {
		service.disconnect(id);
		return ResponseEntity.noContent().build();
	}

}
