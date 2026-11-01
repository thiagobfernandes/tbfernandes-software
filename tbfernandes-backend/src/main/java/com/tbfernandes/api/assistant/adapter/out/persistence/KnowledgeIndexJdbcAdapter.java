package com.tbfernandes.api.assistant.adapter.out.persistence;

import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.tbfernandes.api.assistant.application.port.out.KnowledgeIndex;
import com.tbfernandes.api.assistant.domain.IndexedChunk;
import com.tbfernandes.api.assistant.domain.KnowledgeDocument;
import com.tbfernandes.api.assistant.domain.KnowledgeDocument.Kind;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * The retrieval index in assistant.knowledge_chunk (AST-04). Plain JDBC, because the rows are
 * derived data replaced as a whole and the embedding is a real[] array.
 */
@Component
class KnowledgeIndexJdbcAdapter implements KnowledgeIndex {

	private final JdbcTemplate jdbc;

	KnowledgeIndexJdbcAdapter(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public Map<KnowledgeDocument.Key, String> fingerprints(UUID ownerId) {
		Map<KnowledgeDocument.Key, String> result = new HashMap<>();
		jdbc.query("SELECT DISTINCT source_kind, source_id, fingerprint FROM assistant.knowledge_chunk WHERE owner_id = ?",
				rs -> {
					result.put(key(rs), rs.getString("fingerprint"));
				}, ownerId);
		return result;
	}

	@Override
	public void replace(UUID ownerId, KnowledgeDocument.Key document, String fingerprint, String embeddingModel,
			List<IndexedChunk> chunks) {
		delete(ownerId, document);
		jdbc.batchUpdate("""
				INSERT INTO assistant.knowledge_chunk
				  (owner_id, source_kind, source_id, position, title, content, fingerprint, embedding_model, embedding)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""", chunks, chunks.size(), (ps, chunk) -> {
			ps.setObject(1, ownerId);
			ps.setString(2, document.kind().name());
			ps.setObject(3, document.id());
			ps.setInt(4, chunk.position());
			ps.setString(5, chunk.title());
			ps.setString(6, chunk.text());
			ps.setString(7, fingerprint);
			ps.setString(8, embeddingModel);
			if (chunk.vector() == null) {
				ps.setNull(9, java.sql.Types.ARRAY);
			}
			else {
				ps.setArray(9, ps.getConnection().createArrayOf("float4", boxed(chunk.vector())));
			}
		});
	}

	@Override
	public void remove(UUID ownerId, Collection<KnowledgeDocument.Key> documents) {
		documents.forEach(document -> delete(ownerId, document));
	}

	@Override
	public List<IndexedChunk> chunks(UUID ownerId) {
		return jdbc.query("""
				SELECT source_kind, source_id, position, title, content, embedding
				FROM assistant.knowledge_chunk WHERE owner_id = ? ORDER BY source_kind, source_id, position""",
				(rs, row) -> new IndexedChunk(key(rs), rs.getInt("position"), rs.getString("title"),
						rs.getString("content"), vector(rs.getArray("embedding"))),
				ownerId);
	}

	private void delete(UUID ownerId, KnowledgeDocument.Key document) {
		jdbc.update("DELETE FROM assistant.knowledge_chunk WHERE owner_id = ? AND source_kind = ? AND source_id = ?",
				ownerId, document.kind().name(), document.id());
	}

	private static KnowledgeDocument.Key key(ResultSet rs) throws SQLException {
		return new KnowledgeDocument.Key(Kind.valueOf(rs.getString("source_kind")), rs.getObject("source_id", UUID.class));
	}

	private static Float[] boxed(float[] vector) {
		Float[] boxed = new Float[vector.length];
		for (int i = 0; i < vector.length; i++) {
			boxed[i] = vector[i];
		}
		return boxed;
	}

	private static float[] vector(Array array) throws SQLException {
		if (array == null) {
			return null;
		}
		Object[] values = (Object[]) array.getArray();
		float[] vector = new float[values.length];
		for (int i = 0; i < values.length; i++) {
			vector[i] = ((Number) values[i]).floatValue();
		}
		return vector;
	}

}
