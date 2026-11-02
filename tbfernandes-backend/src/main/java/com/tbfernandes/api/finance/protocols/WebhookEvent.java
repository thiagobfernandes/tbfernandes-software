package com.tbfernandes.api.finance.protocols;

import java.util.List;

public record WebhookEvent(String event, String itemId, String clientUserId, List<String> transactionIds) {
}
