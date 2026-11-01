package com.tbfernandes.api.finance.protocols;

/** itemId is set when logging in again: the widget needs it to update that connection. */
public record ConnectTokenResponse(String accessToken, String itemId) {
}
