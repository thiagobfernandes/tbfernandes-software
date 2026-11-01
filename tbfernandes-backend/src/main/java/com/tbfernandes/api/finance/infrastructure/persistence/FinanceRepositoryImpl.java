package com.tbfernandes.api.finance.infrastructure.persistence;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.tbfernandes.api.finance.domain.EntryKind;
import com.tbfernandes.api.finance.domain.EntryScope;
import com.tbfernandes.api.finance.domain.EntrySource;
import com.tbfernandes.api.finance.domain.FinanceEntry;
import com.tbfernandes.api.finance.domain.FinanceRepository;
import com.tbfernandes.api.finance.domain.PurchaseGoal;
import com.tbfernandes.api.finance.domain.PurchasePriority;
import com.tbfernandes.api.finance.domain.PurchaseStatus;
import com.tbfernandes.api.shared.infrastructure.persistence.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Component;

@Component
class FinanceRepositoryImpl implements FinanceRepository {

	private final EntryJpa entries;
	private final PurchaseJpa purchases;

	FinanceRepositoryImpl(EntryJpa entries, PurchaseJpa purchases) {
		this.entries = entries;
		this.purchases = purchases;
	}

	@Override
	public FinanceEntry save(FinanceEntry entry) {
		EntryEntity e = entries.findById(entry.id()).orElseGet(EntryEntity::new);
		e.id = entry.id();
		e.ownerId = entry.ownerId();
		FinanceEntry.Details d = entry.details();
		e.kind = d.kind();
		e.scope = d.scope();
		e.category = d.category();
		e.description = d.description();
		e.amount = d.amount();
		e.entryDate = d.date();
		e.recurring = d.recurring();
		e.source = entry.source();
		e.externalId = entry.externalId();
		return toDomain(entries.save(e));
	}

	@Override
	public Optional<FinanceEntry> findEntry(UUID ownerId, UUID id) {
		return entries.findByOwnerIdAndId(ownerId, id).map(FinanceRepositoryImpl::toDomain);
	}

	@Override
	public List<FinanceEntry> findEntries(UUID ownerId, LocalDate from, LocalDate to, EntryScope scope) {
		Specification<EntryEntity> spec = (root, query, cb) -> {
			List<Predicate> where = new ArrayList<>();
			where.add(cb.equal(root.get("ownerId"), ownerId));
			if (from != null) {
				where.add(cb.greaterThanOrEqualTo(root.get("entryDate"), from));
			}
			if (to != null) {
				where.add(cb.lessThanOrEqualTo(root.get("entryDate"), to));
			}
			if (scope != null) {
				where.add(cb.equal(root.get("scope"), scope));
			}
			return cb.and(where.toArray(Predicate[]::new));
		};
		return entries.findAll(spec, Sort.by(Sort.Direction.DESC, "entryDate", "createdAt"))
			.stream()
			.map(FinanceRepositoryImpl::toDomain)
			.toList();
	}

	@Override
	public boolean existsExternal(UUID ownerId, String externalId) {
		return entries.existsByOwnerIdAndExternalId(ownerId, externalId);
	}

	@Override
	public void delete(FinanceEntry entry) {
		entries.deleteById(entry.id());
	}

	@Override
	public void deleteImported(UUID ownerId, List<String> externalIds) {
		entries.deleteByOwnerIdAndExternalIdIn(ownerId, externalIds);
	}

	@Override
	public PurchaseGoal save(PurchaseGoal purchase) {
		PurchaseEntity e = purchases.findById(purchase.id()).orElseGet(PurchaseEntity::new);
		e.id = purchase.id();
		e.ownerId = purchase.ownerId();
		PurchaseGoal.Details d = purchase.details();
		e.name = d.name();
		e.description = d.description();
		e.estimated = d.estimated();
		e.reserved = d.reserved();
		e.monthlySaving = d.monthlySaving();
		e.priority = d.priority();
		e.desiredDate = d.desiredDate();
		e.goalId = d.goalId();
		e.status = d.status();
		e.paid = d.paid();
		return toDomain(purchases.save(e));
	}

	@Override
	public Optional<PurchaseGoal> findPurchase(UUID ownerId, UUID id) {
		return purchases.findByOwnerIdAndId(ownerId, id).map(FinanceRepositoryImpl::toDomain);
	}

	@Override
	public List<PurchaseGoal> findPurchases(UUID ownerId) {
		return purchases.findByOwnerId(ownerId, Sort.by("desiredDate", "name"))
			.stream()
			.map(FinanceRepositoryImpl::toDomain)
			.toList();
	}

	@Override
	public void delete(PurchaseGoal purchase) {
		purchases.deleteById(purchase.id());
	}

	private static FinanceEntry toDomain(EntryEntity e) {
		return FinanceEntry.restore(e.id, e.ownerId, new FinanceEntry.Details(e.kind, e.scope, e.category,
				e.description, e.amount, e.entryDate, e.recurring), e.source, e.externalId);
	}

	private static PurchaseGoal toDomain(PurchaseEntity e) {
		return PurchaseGoal.restore(e.id, e.ownerId, new PurchaseGoal.Details(e.name, e.description, e.estimated,
				e.reserved, e.monthlySaving, e.priority, e.desiredDate, e.goalId, e.status, e.paid));
	}

	@Entity
	@Table(schema = "finance", name = "entry")
	static class EntryEntity extends AuditedEntity {

		@Enumerated(EnumType.STRING)
		EntryKind kind;

		@Enumerated(EnumType.STRING)
		EntryScope scope;

		String category;

		String description;

		BigDecimal amount;

		@Column(name = "entry_date")
		LocalDate entryDate;

		boolean recurring;

		@Enumerated(EnumType.STRING)
		EntrySource source;

		String externalId;

	}

	@Entity
	@Table(schema = "finance", name = "purchase_goal")
	static class PurchaseEntity extends AuditedEntity {

		String name;

		String description;

		BigDecimal estimated;

		BigDecimal reserved;

		BigDecimal monthlySaving;

		@Enumerated(EnumType.STRING)
		PurchasePriority priority;

		LocalDate desiredDate;

		UUID goalId;

		@Enumerated(EnumType.STRING)
		PurchaseStatus status;

		BigDecimal paid;

	}

}

interface EntryJpa extends JpaRepository<FinanceRepositoryImpl.EntryEntity, UUID>,
		JpaSpecificationExecutor<FinanceRepositoryImpl.EntryEntity> {

	Optional<FinanceRepositoryImpl.EntryEntity> findByOwnerIdAndId(UUID ownerId, UUID id);

	boolean existsByOwnerIdAndExternalId(UUID ownerId, String externalId);

	void deleteByOwnerIdAndExternalIdIn(UUID ownerId, List<String> externalIds);

}

interface PurchaseJpa extends JpaRepository<FinanceRepositoryImpl.PurchaseEntity, UUID> {

	Optional<FinanceRepositoryImpl.PurchaseEntity> findByOwnerIdAndId(UUID ownerId, UUID id);

	List<FinanceRepositoryImpl.PurchaseEntity> findByOwnerId(UUID ownerId, Sort sort);

}
