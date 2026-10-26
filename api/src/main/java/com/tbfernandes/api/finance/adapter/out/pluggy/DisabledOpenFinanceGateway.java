package com.tbfernandes.api.finance.adapter.out.pluggy;

import java.time.LocalDate;
import java.util.List;

import com.tbfernandes.api.finance.application.port.out.OpenFinanceGateway;
import com.tbfernandes.api.shared.domain.BusinessRuleViolation;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Default while open finance is off: manual entries keep working (RN-15). */
@Component
@ConditionalOnProperty(prefix = "tbf.pluggy", name = "enabled", havingValue = "false", matchIfMissing = true)
class DisabledOpenFinanceGateway implements OpenFinanceGateway {

	@Override
	public ConnectToken createConnectToken(String clientUserId) {
		throw disabled();
	}

	@Override
	public List<ExternalAccount> listAccounts(String connectionId) {
		throw disabled();
	}

	@Override
	public List<ExternalTransaction> listTransactions(String accountId, LocalDate from, LocalDate to) {
		throw disabled();
	}

	private static BusinessRuleViolation disabled() {
		return new BusinessRuleViolation("RN-15", "Open finance is disabled; use manual entries");
	}

}
