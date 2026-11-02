package com.tbfernandes.api.finance.protocols;

import com.tbfernandes.api.finance.domain.EntryScope;

public record RegisterRequest(String itemId, EntryScope scope) {
}
