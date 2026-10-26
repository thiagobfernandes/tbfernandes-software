package com.tbfernandes.api.work;

import java.util.UUID;

/** Published after deleting a task. Other modules drop their links to it. */
public record TaskDeleted(UUID ownerId, UUID taskId) {
}
