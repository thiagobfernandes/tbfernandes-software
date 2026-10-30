/**
 * Work: companies, projects and tasks (frontend: Work group of the sidebar).
 * <p>
 * Reference module for the clean architecture layout used by every other module:
 * {@code domain} (pure Java), {@code application} (use cases and ports),
 * {@code adapter.in.web} (REST) and {@code adapter.out.persistence} (JPA).
 * Other modules may only use the types in this package, such as {@link com.tbfernandes.api.work.TaskCompleted}.
 */
@ApplicationModule(displayName = "Work")
package com.tbfernandes.api.work;

import org.springframework.modulith.ApplicationModule;
