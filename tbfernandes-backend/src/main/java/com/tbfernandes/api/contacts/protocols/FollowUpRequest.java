package com.tbfernandes.api.contacts.protocols;

import java.time.LocalDate;

public record FollowUpRequest(String title, LocalDate dueDate) {
}
