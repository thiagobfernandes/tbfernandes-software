/**
 * Identity: the account that owns the data (single user for now; login later, backlog IDN-01).
 * Layout follows the work module: domain, application, adapter.in.web, adapter.out.persistence.
 */
@ApplicationModule(displayName = "Identity")
package com.tbfernandes.api.identity;

import org.springframework.modulith.ApplicationModule;
