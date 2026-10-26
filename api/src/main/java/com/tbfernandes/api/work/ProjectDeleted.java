package com.tbfernandes.api.work;

import java.util.UUID;

/** Published after deleting a project; its tasks were unlinked, not deleted. Other modules drop their links to it. */
public record ProjectDeleted(UUID ownerId, UUID projectId) {
}
