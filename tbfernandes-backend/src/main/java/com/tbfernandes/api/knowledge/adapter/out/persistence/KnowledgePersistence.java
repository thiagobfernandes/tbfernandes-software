package com.tbfernandes.api.knowledge.adapter.out.persistence;

import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;

import com.tbfernandes.api.knowledge.domain.method.Method;
import com.tbfernandes.api.knowledge.domain.method.Method.Example;
import com.tbfernandes.api.knowledge.domain.method.Method.MethodDetails;
import com.tbfernandes.api.knowledge.domain.method.Method.Step;
import com.tbfernandes.api.knowledge.domain.method.MethodRepository;
import com.tbfernandes.api.knowledge.domain.note.Note;
import com.tbfernandes.api.knowledge.domain.note.NoteRepository;
import com.tbfernandes.api.knowledge.domain.snippet.Snippet;
import com.tbfernandes.api.knowledge.domain.snippet.SnippetDetails;
import com.tbfernandes.api.knowledge.domain.snippet.SnippetRepository;
import org.springframework.stereotype.Component;

/** Adapters for the knowledge ports. Search runs in SQL and returns ids; entities load by id. */
final class KnowledgePersistence {

	private KnowledgePersistence() {
	}

	/** Keeps the order of the ids returned by a search query. */
	static <E> List<E> inOrder(List<UUID> ids, List<E> entities, Function<E, UUID> id) {
		Map<UUID, Integer> position = new HashMap<>();
		for (int i = 0; i < ids.size(); i++) {
			position.put(ids.get(i), i);
		}
		return entities.stream().sorted(Comparator.comparing(e -> position.get(id.apply(e)))).toList();
	}

	static String[] array(List<String> values) {
		return values.toArray(String[]::new);
	}

	static List<String> list(String[] values) {
		return values == null ? List.of() : Arrays.asList(values);
	}

	@Component
	static class NoteAdapter implements NoteRepository {

		private final NoteJpaRepository notes;

		NoteAdapter(NoteJpaRepository notes) {
			this.notes = notes;
		}

		@Override
		public Note save(Note note) {
			NoteJpaEntity e = notes.findById(note.id()).orElseGet(NoteJpaEntity::new);
			e.id = note.id();
			e.ownerId = note.ownerId();
			e.title = note.title();
			e.body = note.body();
			e.tags = array(note.tags());
			e.links.clear();
			e.links.addAll(LinkEmbeddable.from(note.links()));
			return toDomain(notes.saveAndFlush(e));
		}

		@Override
		public Optional<Note> findById(UUID ownerId, UUID id) {
			return notes.findByOwnerIdAndId(ownerId, id).map(NoteAdapter::toDomain);
		}

		@Override
		public List<Note> search(UUID ownerId, String text, String tag) {
			return load(notes.searchIds(ownerId, text, tag));
		}

		@Override
		public List<Note> linkedTo(UUID ownerId, UUID workItemId) {
			return load(notes.idsLinkedTo(ownerId, workItemId));
		}

		@Override
		public void delete(Note note) {
			notes.deleteById(note.id());
		}

		private List<Note> load(List<UUID> ids) {
			return inOrder(ids, notes.findAllById(ids), e -> e.id).stream().map(NoteAdapter::toDomain).toList();
		}

		private static Note toDomain(NoteJpaEntity e) {
			return Note.restore(e.id, e.ownerId, e.title, e.body, list(e.tags), LinkEmbeddable.toLinks(e.links),
					e.createdAt, e.updatedAt);
		}

	}

	@Component
	static class SnippetAdapter implements SnippetRepository {

		private final SnippetJpaRepository snippets;

		SnippetAdapter(SnippetJpaRepository snippets) {
			this.snippets = snippets;
		}

		@Override
		public Snippet save(Snippet snippet) {
			SnippetJpaEntity e = snippets.findById(snippet.id()).orElseGet(SnippetJpaEntity::new);
			e.id = snippet.id();
			e.ownerId = snippet.ownerId();
			SnippetDetails d = snippet.details();
			e.title = d.title();
			e.language = d.language();
			e.code = d.code();
			e.explanation = d.explanation();
			e.sourceUrl = d.sourceUrl();
			e.tags = array(d.tags());
			e.links.clear();
			e.links.addAll(LinkEmbeddable.from(snippet.links()));
			return toDomain(snippets.saveAndFlush(e));
		}

		@Override
		public Optional<Snippet> findById(UUID ownerId, UUID id) {
			return snippets.findByOwnerIdAndId(ownerId, id).map(SnippetAdapter::toDomain);
		}

		@Override
		public List<Snippet> search(UUID ownerId, String text, String language, String tag) {
			return load(snippets.searchIds(ownerId, text, language, tag));
		}

		@Override
		public List<Snippet> linkedTo(UUID ownerId, UUID workItemId) {
			return load(snippets.idsLinkedTo(ownerId, workItemId));
		}

		@Override
		public void delete(Snippet snippet) {
			snippets.deleteById(snippet.id());
		}

		private List<Snippet> load(List<UUID> ids) {
			return inOrder(ids, snippets.findAllById(ids), e -> e.id).stream()
				.map(SnippetAdapter::toDomain)
				.toList();
		}

		private static Snippet toDomain(SnippetJpaEntity e) {
			return Snippet.restore(e.id, e.ownerId,
					new SnippetDetails(e.title, e.language, e.code, e.explanation, e.sourceUrl, list(e.tags)),
					LinkEmbeddable.toLinks(e.links), e.createdAt, e.updatedAt);
		}

	}

	@Component
	static class MethodAdapter implements MethodRepository {

		private final MethodJpaRepository methods;

		MethodAdapter(MethodJpaRepository methods) {
			this.methods = methods;
		}

		@Override
		public Method save(Method method) {
			MethodJpaEntity e = methods.findById(method.id()).orElseGet(MethodJpaEntity::new);
			e.id = method.id();
			e.ownerId = method.ownerId();
			MethodDetails d = method.details();
			e.title = d.title();
			e.summary = d.summary();
			e.category = d.category();
			e.tags = array(d.tags());
			e.lastReviewed = d.lastReviewed();
			e.steps.clear();
			d.steps().forEach(s -> e.steps.add(new MethodJpaEntity.StepEmbeddable(s.title(), s.detail())));
			e.examples.clear();
			d.examples().forEach(x -> e.examples.add(new MethodJpaEntity.ExampleEmbeddable(x.title(), x.content())));
			return toDomain(methods.save(e));
		}

		@Override
		public Optional<Method> findById(UUID ownerId, UUID id) {
			return methods.findByOwnerIdAndId(ownerId, id).map(MethodAdapter::toDomain);
		}

		@Override
		public List<Method> findAll(UUID ownerId) {
			return methods.findByOwnerIdOrderByTitle(ownerId).stream().map(MethodAdapter::toDomain).toList();
		}

		@Override
		public void delete(Method method) {
			methods.deleteById(method.id());
		}

		private static Method toDomain(MethodJpaEntity e) {
			return Method.restore(e.id, e.ownerId,
					new MethodDetails(e.title, e.summary, e.category,
							e.steps.stream().map(s -> new Step(s.title(), s.detail())).toList(),
							e.examples.stream().map(x -> new Example(x.title(), x.content())).toList(), list(e.tags),
							e.lastReviewed));
		}

	}

}
