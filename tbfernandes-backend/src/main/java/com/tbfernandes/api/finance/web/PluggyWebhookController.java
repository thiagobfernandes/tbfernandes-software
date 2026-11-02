package com.tbfernandes.api.finance.web;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import com.tbfernandes.api.finance.application.OpenFinanceService;
import com.tbfernandes.api.finance.protocols.WebhookEvent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

/**
 * FIN-OF-06. Public route (no session or CSRF, see SecurityConfig): Pluggy does not sign its
 * webhooks, so it proves itself with the secret header set when the webhook was registered
 * (api/scripts/pluggy-register-webhook.sh). Without a configured secret every call is refused.
 */
@RestController
class PluggyWebhookController {

	private final OpenFinanceService service;
	private final byte[] secret;

	PluggyWebhookController(OpenFinanceService service, @Value("${tbf.pluggy.webhook-secret:}") String secret) {
		this.service = service;
		this.secret = secret.getBytes(StandardCharsets.UTF_8);
	}

	@PostMapping("/api/v1/webhooks/pluggy")
	ResponseEntity<Void> receive(@RequestHeader(name = "X-Webhook-Secret", required = false) String received,
			@RequestBody WebhookEvent event) {
		if (!authentic(received)) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}
		switch (event.event()) {
			case "item/updated", "item/error" -> service.connectionChanged(event.itemId(), event.clientUserId());
			case "item/deleted" -> service.connectionDeleted(event.itemId());
			case "transactions/deleted" -> service.transactionsDeleted(event.itemId(), event.transactionIds());
			default -> {
				// Other events carry nothing this app acts on.
			}
		}
		return ResponseEntity.noContent().build();
	}

	private boolean authentic(String received) {
		return secret.length > 0 && received != null
				&& MessageDigest.isEqual(secret, received.getBytes(StandardCharsets.UTF_8));
	}

}
