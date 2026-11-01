package com.tbfernandes.api.goals.protocols;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;

public record ProgressRequest(@NotNull BigDecimal current) {
}
