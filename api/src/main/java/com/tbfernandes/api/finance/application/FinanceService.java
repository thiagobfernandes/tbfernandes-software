package com.tbfernandes.api.finance.application;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import com.tbfernandes.api.finance.FinanceLookup;
import com.tbfernandes.api.finance.application.CashFlow.CategoryTotal;
import com.tbfernandes.api.finance.application.CashFlow.MonthTotals;
import com.tbfernandes.api.finance.domain.EntryKind;
import com.tbfernandes.api.finance.domain.EntryScope;
import com.tbfernandes.api.finance.domain.FinanceEntry;
import com.tbfernandes.api.finance.domain.FinanceRepository;
import com.tbfernandes.api.finance.domain.PurchaseGoal;
import com.tbfernandes.api.shared.application.OwnerContext;
import com.tbfernandes.api.shared.domain.NotFound;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Manual finance use cases (RF-FIN-01..04). Open finance (FIN-OF) stays behind OpenFinanceGateway. */
@Service
@Transactional
public class FinanceService implements FinanceLookup {

	private final FinanceRepository repository;
	private final OwnerContext owner;
	private final Clock clock;

	FinanceService(FinanceRepository repository, OwnerContext owner, Clock clock) {
		this.repository = repository;
		this.owner = owner;
		this.clock = clock;
	}

	// Entries

	public FinanceEntry createEntry(FinanceEntry.Details details) {
		return repository.save(FinanceEntry.create(owner.currentOwnerId(), details));
	}

	public FinanceEntry updateEntry(UUID id, FinanceEntry.Details details) {
		FinanceEntry entry = entry(id);
		entry.update(details);
		return repository.save(entry);
	}

	public void deleteEntry(UUID id) {
		repository.delete(entry(id));
	}

	@Transactional(readOnly = true)
	public FinanceEntry entry(UUID id) {
		return repository.findEntry(owner.currentOwnerId(), id).orElseThrow(() -> new NotFound("Entry", id));
	}

	@Transactional(readOnly = true)
	public List<FinanceEntry> entries(YearMonth month, EntryScope scope) {
		LocalDate from = month == null ? null : month.atDay(1);
		LocalDate to = month == null ? null : month.atEndOfMonth();
		return repository.findEntries(owner.currentOwnerId(), from, to, scope);
	}

	/** FIN-02. Without a scope both are summed, which the screen warns can double count transfers. */
	@Transactional(readOnly = true)
	public CashFlow cashFlow(YearMonth month, int months, EntryScope scope) {
		YearMonth selected = month == null ? YearMonth.now(clock) : month;
		YearMonth first = selected.minusMonths(Math.max(1, months) - 1L);
		List<FinanceEntry> entries = repository.findEntries(owner.currentOwnerId(), first.atDay(1),
				selected.atEndOfMonth(), scope);
		Map<YearMonth, List<FinanceEntry>> byMonth = entries.stream()
			.collect(Collectors.groupingBy(e -> YearMonth.from(e.details().date())));
		List<MonthTotals> series = new ArrayList<>();
		for (YearMonth m = first; !m.isAfter(selected); m = m.plusMonths(1)) {
			series.add(totals(m, byMonth.getOrDefault(m, List.of())));
		}
		List<CategoryTotal> categories = byMonth.getOrDefault(selected, List.of())
			.stream()
			.filter(e -> e.details().kind() == EntryKind.EXPENSE)
			.collect(Collectors.groupingBy(e -> e.details().category(),
					Collectors.reducing(BigDecimal.ZERO, e -> e.details().amount(), BigDecimal::add)))
			.entrySet()
			.stream()
			.map(e -> new CategoryTotal(e.getKey(), e.getValue()))
			.sorted(Comparator.comparing(CategoryTotal::amount).reversed())
			.toList();
		return new CashFlow(selected, scope == null ? "all" : scope.name().toLowerCase(), series.getLast(), series,
				categories);
	}

	private static MonthTotals totals(YearMonth month, List<FinanceEntry> entries) {
		BigDecimal income = sum(entries, EntryKind.INCOME);
		BigDecimal expense = sum(entries, EntryKind.EXPENSE);
		return new MonthTotals(month, income, expense, income.subtract(expense));
	}

	private static BigDecimal sum(List<FinanceEntry> entries, EntryKind kind) {
		return entries.stream()
			.filter(e -> e.details().kind() == kind)
			.map(e -> e.details().amount())
			.reduce(BigDecimal.ZERO, BigDecimal::add);
	}

	// Purchases

	public PurchaseGoal createPurchase(PurchaseGoal.Details details) {
		return repository.save(PurchaseGoal.create(owner.currentOwnerId(), details));
	}

	public PurchaseGoal updatePurchase(UUID id, PurchaseGoal.Details details) {
		PurchaseGoal purchase = purchase(id);
		purchase.update(details);
		return repository.save(purchase);
	}

	public void deletePurchase(UUID id) {
		repository.delete(purchase(id));
	}

	@Transactional(readOnly = true)
	public PurchaseGoal purchase(UUID id) {
		return repository.findPurchase(owner.currentOwnerId(), id).orElseThrow(() -> new NotFound("Purchase", id));
	}

	@Transactional(readOnly = true)
	public List<PurchaseGoal> purchases() {
		return repository.findPurchases(owner.currentOwnerId());
	}

	@Transactional(readOnly = true)
	public PurchaseGoal.Projection projection(UUID id) {
		return purchase(id).project(LocalDate.now(clock));
	}

	// Public API

	@Override
	@Transactional(readOnly = true)
	public List<PurchaseView> purchases(UUID ownerId) {
		return repository.findPurchases(ownerId)
			.stream()
			.map(p -> new PurchaseView(p.id(), p.details().name(), p.details().status().name().toLowerCase(),
					p.details().goalId(), p.details().estimated(), p.details().reserved()))
			.toList();
	}

	@Override
	@Transactional(readOnly = true)
	public MonthView month(UUID ownerId, YearMonth month) {
		List<FinanceEntry> entries = repository.findEntries(ownerId, month.atDay(1), month.atEndOfMonth(),
				EntryScope.PERSONAL);
		return new MonthView(month, sum(entries, EntryKind.INCOME), sum(entries, EntryKind.EXPENSE));
	}

}
