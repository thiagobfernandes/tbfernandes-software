package com.tbfernandes.api.finance.infrastructure.pluggy;

import java.time.LocalDate;
import java.util.List;

import com.tbfernandes.api.finance.application.OpenFinanceGateway;
import com.tbfernandes.api.shared.domain.BusinessRuleViolation;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Default while open finance is off: manual entries keep working (RN-15). */
@Component
@ConditionalOnProperty(prefix = "tbf.pluggy", name = "enabled", havingValue = "false", matchIfMissing = true)
class DisabledOpenFinanceGateway implements OpenFinanceGateway {

	@Override
	public boolean enabled() {
		return false;
	}

	@Override
	public ConnectToken createConnectToken(String clientUserId, String connectionId) {
		throw disabled();
	}

	@Override
	public ExternalConnection getConnection(String connectionId) {
		throw disabled();
	}

	@Override
	public List<ExternalAccount> listAccounts(String connectionId) {
		throw disabled();
	}

	@Override
	public List<ExternalTransaction> listTransactions(ExternalAccount account, LocalDate from, LocalDate to) {
		throw disabled();
	}

	@Override
	public void deleteConnection(String connectionId) {
		throw disabled();
	}

	private static BusinessRuleViolation disabled() {
		return new BusinessRuleViolation("RN-15", "O Open Finance está desativado; use lançamentos manuais");
	}

}
