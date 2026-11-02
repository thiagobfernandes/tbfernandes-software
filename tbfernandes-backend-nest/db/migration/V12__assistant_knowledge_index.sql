-- Retrieval index of the assistant (AST-04): the passages of each owner's notes and snippets and
-- their embeddings. Derived data, rebuilt from the knowledge schema whenever a fingerprint changes,
-- so it has no audit or version columns. The embedding is a plain real[] because the PostgreSQL
-- bundled with the desktop app has no pgvector; similarity is computed in the application.
-- Moving to pgvector later is a cast: embedding::vector.
CREATE SCHEMA assistant;

CREATE TABLE assistant.knowledge_chunk
(
  owner_id        uuid        NOT NULL,
  source_kind     text        NOT NULL CHECK (source_kind IN ('NOTE', 'SNIPPET')),
  source_id       uuid        NOT NULL, -- knowledge.note or knowledge.snippet, checked by the application
  position        int         NOT NULL CHECK (position >= 0),
  title           text        NOT NULL,
  content         text        NOT NULL,
  fingerprint     varchar(64) NOT NULL, -- SHA-256 of title, text and embedding model
  embedding_model varchar(80) NOT NULL, -- 'none' when stored without a vector
  embedding       real[],
  indexed_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, source_kind, source_id, position)
);
