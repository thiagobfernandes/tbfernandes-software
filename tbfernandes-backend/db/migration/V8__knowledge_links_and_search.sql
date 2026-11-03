-- Etapa 3 (KNW-03, KNW-04).
-- item_link mixed notes and snippets behind a discriminator, which JPA cannot write as a
-- plain collection. One link table per owner type replaces it; existing rows move over.

CREATE TABLE knowledge.note_link
(
  note_id     uuid NOT NULL REFERENCES knowledge.note (id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('PROJECT', 'TASK')),
  target_id   uuid NOT NULL, -- work.project / work.task (other module)
  PRIMARY KEY (note_id, target_type, target_id)
);
CREATE INDEX note_link_target_idx ON knowledge.note_link (target_id);

CREATE TABLE knowledge.snippet_link
(
  snippet_id  uuid NOT NULL REFERENCES knowledge.snippet (id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('PROJECT', 'TASK')),
  target_id   uuid NOT NULL,
  PRIMARY KEY (snippet_id, target_type, target_id)
);
CREATE INDEX snippet_link_target_idx ON knowledge.snippet_link (target_id);

INSERT INTO knowledge.note_link (note_id, target_type, target_id)
SELECT l.item_id, l.target_type, l.target_id
FROM knowledge.item_link l JOIN knowledge.note n ON n.id = l.item_id
WHERE l.item_type = 'NOTE';

INSERT INTO knowledge.snippet_link (snippet_id, target_type, target_id)
SELECT l.item_id, l.target_type, l.target_id
FROM knowledge.item_link l JOIN knowledge.snippet s ON s.id = l.item_id
WHERE l.item_type = 'SNIPPET';

DROP TABLE knowledge.item_link;

-- Full-text search. 'simple' keeps words as written, which suits mixed Portuguese,
-- English and code identifiers better than a language stemmer.
ALTER TABLE knowledge.note
  ADD COLUMN search tsvector GENERATED ALWAYS AS (to_tsvector('simple', title || ' ' || body)) STORED;
CREATE INDEX note_search_idx ON knowledge.note USING gin (search);

ALTER TABLE knowledge.snippet
  ADD COLUMN search tsvector GENERATED ALWAYS AS (
    to_tsvector('simple', title || ' ' || coalesce(explanation, '') || ' ' || code)) STORED;
CREATE INDEX snippet_search_idx ON knowledge.snippet USING gin (search);
