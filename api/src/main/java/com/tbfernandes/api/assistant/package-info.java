/**
 * Assistant: answers questions over the data of the other modules, read-only in v1
 * (RN-20). Uses only their public query APIs; AI provider behind an output port (backlog AST-*).
 */
@ApplicationModule(displayName = "Assistant")
package com.tbfernandes.api.assistant;

import org.springframework.modulith.ApplicationModule;
