package com.tbfernandes.api.work;

import java.time.Instant;
import java.util.UUID;

/**
 * Published when a task moves to done (RN-06). Goals and the dashboard listen to it
 * instead of reading the work tables.
 */
public record TaskCompleted(UUID ownerId, UUID taskId, UUID projectId, UUID goalId, Instant completedAt) {
}
