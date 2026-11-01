package com.tbfernandes.api.work.protocols;

import com.tbfernandes.api.work.domain.task.TaskStatus;
import jakarta.validation.constraints.NotNull;

public record StatusRequest(@NotNull TaskStatus status) {
}
