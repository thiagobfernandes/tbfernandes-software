package com.tbfernandes.api.work.protocols;

import jakarta.validation.constraints.PositiveOrZero;

public record Progress(@PositiveOrZero int done, @PositiveOrZero int total) {
}
