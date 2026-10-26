package com.tbfernandes.api.knowledge.adapter.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

interface NoteJpaRepository extends JpaRepository<NoteJpaEntity, UUID> {

	Optional<NoteJpaEntity> findByOwnerIdAndId(UUID ownerId, UUID id);

	/** Full-text match, with a prefix match on the title so partial words still find notes. */
	@Query(nativeQuery = true, value = """
			select id from knowledge.note
			where owner_id = :ownerId
			  and (cast(:text as text) is null
			       or search @@ plainto_tsquery('simple', :text)
			       or title ilike '%' || :text || '%')
			  and (cast(:tag as text) is null or :tag = any(tags))
			order by updated_at desc""")
	List<UUID> searchIds(UUID ownerId, String text, String tag);

	@Query(nativeQuery = true, value = """
			select n.id from knowledge.note n join knowledge.note_link l on l.note_id = n.id
			where n.owner_id = :ownerId and l.target_id = :targetId""")
	List<UUID> idsLinkedTo(UUID ownerId, UUID targetId);

}

interface SnippetJpaRepository extends JpaRepository<SnippetJpaEntity, UUID> {

	Optional<SnippetJpaEntity> findByOwnerIdAndId(UUID ownerId, UUID id);

	@Query(nativeQuery = true, value = """
			select id from knowledge.snippet
			where owner_id = :ownerId
			  and (cast(:text as text) is null
			       or search @@ plainto_tsquery('simple', :text)
			       or title ilike '%' || :text || '%')
			  and (cast(:language as text) is null or language = :language)
			  and (cast(:tag as text) is null or :tag = any(tags))
			order by updated_at desc""")
	List<UUID> searchIds(UUID ownerId, String text, String language, String tag);

	@Query(nativeQuery = true, value = """
			select s.id from knowledge.snippet s join knowledge.snippet_link l on l.snippet_id = s.id
			where s.owner_id = :ownerId and l.target_id = :targetId""")
	List<UUID> idsLinkedTo(UUID ownerId, UUID targetId);

}

interface MethodJpaRepository extends JpaRepository<MethodJpaEntity, UUID> {

	Optional<MethodJpaEntity> findByOwnerIdAndId(UUID ownerId, UUID id);

	List<MethodJpaEntity> findByOwnerIdOrderByTitle(UUID ownerId);

}
