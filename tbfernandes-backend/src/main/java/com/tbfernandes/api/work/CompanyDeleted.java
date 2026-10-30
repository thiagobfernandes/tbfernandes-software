package com.tbfernandes.api.work;

import java.util.UUID;

/** Published after deleting a company (only possible without projects, RN-01). Other modules drop their links to it. */
public record CompanyDeleted(UUID ownerId, UUID companyId) {
}
