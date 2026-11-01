/**
 * Assistant: answers questions over the data of the other modules and builds the knowledge
 * graph, read-only (RN-20). Uses only their public lookups ({@code *Lookup}); the AI provider
 * sits behind the output port {@link com.tbfernandes.api.assistant.application.port.out.LanguageModel},
 * disabled by default. Open questions are answered from passages of notes and snippets (RAG,
 * AST-04), kept in the module's own index with embeddings from the
 * {@link com.tbfernandes.api.assistant.application.port.out.EmbeddingModel} port.
 */
@ApplicationModule(displayName = "Assistant")
package com.tbfernandes.api.assistant;

import org.springframework.modulith.ApplicationModule;
