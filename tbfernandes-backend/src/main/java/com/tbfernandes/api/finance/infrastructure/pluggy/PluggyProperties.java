package com.tbfernandes.api.finance.infrastructure.pluggy;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * tbf.pluggy.*: credentials come from environment variables (PLUGGY_CLIENT_ID,
 * PLUGGY_CLIENT_SECRET), never from the repository (RNF-SEG-05).
 */
@ConfigurationProperties("tbf.pluggy")
record PluggyProperties(boolean enabled, String baseUrl, String clientId, String clientSecret) {
}
