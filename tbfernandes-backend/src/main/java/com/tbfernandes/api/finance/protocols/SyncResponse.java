package com.tbfernandes.api.finance.protocols;

import com.tbfernandes.api.finance.domain.BankConnection;
import com.tbfernandes.api.shared.protocols.Resource;

public record SyncResponse(int imported, Resource<BankConnection.Details> connection) {
}
