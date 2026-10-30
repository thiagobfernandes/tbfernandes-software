package com.tbfernandes.api.finance.application;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.finance.application.port.out.OpenFinanceGateway;
import com.tbfernandes.api.finance.application.port.out.OpenFinanceGateway.ConnectToken;
import com.tbfernandes.api.finance.application.port.out.OpenFinanceGateway.ExternalAccount;
import com.tbfernandes.api.finance.application.port.out.OpenFinanceGateway.ExternalConnection;
import com.tbfernandes.api.finance.application.port.out.OpenFinanceGateway.ExternalTransaction;
import com.tbfernandes.api.finance.domain.BankConnection;
import com.tbfernandes.api.finance.domain.BankConnectionRepository;
import com.tbfernandes.api.finance.domain.EntryScope;
import com.tbfernandes.api.finance.domain.FinanceRepository;
import com.tbfernandes.api.shared.application.OwnerContext;
import com.tbfernandes.api.shared.domain.Conflict;
import com.tbfernandes.api.shared.domain.ExternalServiceFailure;
import com.tbfernandes.api.shared.domain.NotFound;
import com.tbfernandes.api.shared.domain.Require;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Open finance use cases (epic FIN-OF): connect a bank, import its transactions, disconnect. */
@Service
@Transactional
public class OpenFinanceService {

	private static final Logger log = LoggerFactory.getLogger(OpenFinanceService.class);

	/** How far back every sync reads. Imports are idempotent (RN-16), so overlapping is harmless. */
	static final int HISTORY_DAYS = 90;

	private final BankConnectionRepository connections;
	private final FinanceRepository entries;
	private final OpenFinanceGateway gateway;
	private final OwnerContext owner;
	private final ApplicationEventPublisher events;
	private final Clock clock;

	OpenFinanceService(BankConnectionRepository connections, FinanceRepository entries, OpenFinanceGateway gateway,
			OwnerContext owner, ApplicationEventPublisher events, Clock clock) {
		this.connections = connections;
		this.entries = entries;
		this.gateway = gateway;
		this.owner = owner;
		this.events = events;
		this.clock = clock;
	}

	@Transactional(readOnly = true)
	public boolean enabled() {
		return gateway.enabled();
	}

	public ConnectToken connectToken(EntryScope scope) {
		ConnectionClaim claim = new ConnectionClaim(owner.currentOwnerId(), Require.present(scope, "scope"));
		return gateway.createConnectToken(claim.encode(), null);
	}

	/** Token to log in again to a bank that asked for it, keeping the same connection and imports. */
	public ConnectToken reconnectToken(UUID id) {
		BankConnection connection = connection(id);
		ConnectionClaim claim = new ConnectionClaim(connection.ownerId(), connection.details().scope());
		return gateway.createConnectToken(claim.encode(), connection.externalId());
	}

	/** Called by the frontend when the widget succeeds; the webhook may already have registered it. */
	public BankConnection register(String externalId, EntryScope scope) {
		UUID ownerId = owner.currentOwnerId();
		BankConnection connection = findOrRegister(Require.text(externalId, "itemId", 120), ownerId,
				Require.present(scope, "scope"));
		if (!connection.ownerId().equals(ownerId)) {
			throw new Conflict("RN-21", "Esta conexão pertence a outra conta");
		}
		events.publishEvent(new ConnectionSyncRequested(externalId, ownerId, scope));
		return connection;
	}

	@Transactional(readOnly = true)
	public List<BankConnection> connections() {
		return connections.findAll(owner.currentOwnerId());
	}

	@Transactional(readOnly = true)
	public BankConnection connection(UUID id) {
		return connections.find(owner.currentOwnerId(), id).orElseThrow(() -> new NotFound("Connection", id));
	}

	/** Manual sync, from the screen. A provider failure is reported on the connection, not as an error. */
	public SyncResult sync(UUID id) {
		BankConnection connection = connections.lockByExternalId(connection(id).externalId()).orElseThrow();
		int imported = importInto(connection);
		return new SyncResult(imported, connections.save(connection));
	}

	/** Stays connected at the provider if this fails. Imported entries are kept, they are the user's history. */
	public void disconnect(UUID id) {
		BankConnection connection = connections.lockByExternalId(connection(id).externalId()).orElseThrow();
		gateway.deleteConnection(connection.externalId());
		connections.delete(connection);
	}

	// Webhooks: the caller has proved it is the provider, and there is no logged-in owner.

	/** The provider has new data or a new state for this connection. */
	public void connectionChanged(String externalId, String clientUserId) {
		if (connections.findByExternalId(externalId).isPresent()) {
			events.publishEvent(new ConnectionSyncRequested(externalId, null, null));
			return;
		}
		ConnectionClaim.parse(clientUserId)
			.ifPresentOrElse(
					claim -> events
						.publishEvent(new ConnectionSyncRequested(externalId, claim.ownerId(), claim.scope())),
					() -> log.warn("Ignoring webhook for unknown connection {}", externalId));
	}

	public void connectionDeleted(String externalId) {
		connections.lockByExternalId(externalId).ifPresent(connections::delete);
	}

	public void transactionsDeleted(String externalId, List<String> transactionIds) {
		connections.findByExternalId(externalId)
			.ifPresent(connection -> entries.deleteImported(connection.ownerId(), transactionIds));
	}

	void syncRequested(ConnectionSyncRequested event) {
		if (connections.findByExternalId(event.externalId()).isEmpty()) {
			if (event.ownerId() == null) {
				return;
			}
			findOrRegister(event.externalId(), event.ownerId(), event.scope());
		}
		// Gone between the request and now means it was disconnected: nothing to do.
		connections.lockByExternalId(event.externalId()).ifPresent(connection -> {
			importInto(connection);
			connections.save(connection);
		});
	}

	private BankConnection findOrRegister(String externalId, UUID ownerId, EntryScope scope) {
		return connections.findByExternalId(externalId).orElseGet(() -> {
			ExternalConnection external = gateway.getConnection(externalId);
			return connections.saveIfAbsent(
					BankConnection.connect(ownerId, externalId, external.institution(), scope, external.status()));
		});
	}

	/** Reads everything first, so a provider failure leaves no half-finished import. */
	private int importInto(BankConnection connection) {
		ExternalConnection external;
		List<ExternalAccount> accounts;
		List<ExternalTransaction> transactions = new ArrayList<>();
		try {
			LocalDate to = LocalDate.now(clock);
			external = gateway.getConnection(connection.externalId());
			accounts = gateway.listAccounts(connection.externalId());
			for (ExternalAccount account : accounts) {
				transactions.addAll(gateway.listTransactions(account, to.minusDays(HISTORY_DAYS), to));
			}
		}
		catch (ExternalServiceFailure ex) {
			connection.syncFailed(ex.getMessage());
			return 0;
		}
		int imported = 0;
		for (ExternalTransaction t : transactions) {
			if (entries.existsExternal(connection.ownerId(), t.id())) {
				continue;
			}
			var entry = connection.importEntry(t.id(), t.date(), t.description(), t.amount(), t.category());
			if (entry.isPresent()) {
				entries.save(entry.get());
				imported++;
			}
		}
		connection.synced(external.institution(), external.status(),
				accounts.stream()
					.map(a -> new BankConnection.BankAccount(a.id(), a.name(), a.type(), a.balance(), a.currency()))
					.toList(),
				clock.instant());
		return imported;
	}

	public record SyncResult(int imported, BankConnection connection) {
	}

}
