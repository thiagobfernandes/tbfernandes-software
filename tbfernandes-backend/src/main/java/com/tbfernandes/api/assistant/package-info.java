/**
 * Assistant: answers questions over the data of the other modules and builds the knowledge
 * graph, read-only (RN-20). Uses only their public lookups ({@code *Lookup}); the AI provider
 * sits behind the interface {@link com.tbfernandes.api.assistant.application.LanguageModel},
 * disabled by default.
 */
@ApplicationModule(displayName = "Assistant")
package com.tbfernandes.api.assistant;

import org.springframework.modulith.ApplicationModule;
