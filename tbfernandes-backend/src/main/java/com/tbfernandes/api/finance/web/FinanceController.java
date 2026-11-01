package com.tbfernandes.api.finance.web;

import java.net.URI;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.finance.application.CashFlow;
import com.tbfernandes.api.finance.application.FinanceService;
import com.tbfernandes.api.finance.domain.EntryScope;
import com.tbfernandes.api.finance.domain.FinanceEntry;
import com.tbfernandes.api.finance.domain.PurchaseGoal;
import com.tbfernandes.api.shared.protocols.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Entries, cash flow and purchases. Bodies match web/src/features/finance/types/finance.ts. */
@RestController
@RequestMapping("/api/v1/finance")
class FinanceController {

	private final FinanceService service;

	FinanceController(FinanceService service) {
		this.service = service;
	}

	@GetMapping("/entries")
	List<Resource<FinanceEntry.Details>> entries(@RequestParam(required = false) YearMonth month,
			@RequestParam(required = false) EntryScope scope) {
		return service.entries(month, scope).stream().map(Resource::of).toList();
	}

	@GetMapping("/entries/{id}")
	Resource<FinanceEntry.Details> entry(@PathVariable UUID id) {
		return Resource.of(service.entry(id));
	}

	@PostMapping("/entries")
	ResponseEntity<Resource<FinanceEntry.Details>> createEntry(@RequestBody FinanceEntry.Details body) {
		FinanceEntry entry = service.createEntry(body);
		return ResponseEntity.created(URI.create("/api/v1/finance/entries/" + entry.id())).body(Resource.of(entry));
	}

	@PutMapping("/entries/{id}")
	Resource<FinanceEntry.Details> updateEntry(@PathVariable UUID id, @RequestBody FinanceEntry.Details body) {
		return Resource.of(service.updateEntry(id, body));
	}

	@DeleteMapping("/entries/{id}")
	ResponseEntity<Void> deleteEntry(@PathVariable UUID id) {
		service.deleteEntry(id);
		return ResponseEntity.noContent().build();
	}

	/** month=YYYY-MM (default: current), months=how many to show ending at it (default 6). */
	@GetMapping("/cash-flow")
	CashFlow cashFlow(@RequestParam(required = false) YearMonth month,
			@RequestParam(defaultValue = "6") int months, @RequestParam(required = false) EntryScope scope) {
		return service.cashFlow(month, Math.min(months, 24), scope);
	}

	@GetMapping("/purchases")
	List<Resource<PurchaseGoal.Details>> purchases() {
		return service.purchases().stream().map(Resource::of).toList();
	}

	@GetMapping("/purchases/{id}")
	Resource<PurchaseGoal.Details> purchase(@PathVariable UUID id) {
		return Resource.of(service.purchase(id));
	}

	@GetMapping("/purchases/{id}/projection")
	PurchaseGoal.Projection projection(@PathVariable UUID id) {
		return service.projection(id);
	}

	@PostMapping("/purchases")
	ResponseEntity<Resource<PurchaseGoal.Details>> createPurchase(@RequestBody PurchaseGoal.Details body) {
		PurchaseGoal purchase = service.createPurchase(body);
		return ResponseEntity.created(URI.create("/api/v1/finance/purchases/" + purchase.id()))
			.body(Resource.of(purchase));
	}

	@PutMapping("/purchases/{id}")
	Resource<PurchaseGoal.Details> updatePurchase(@PathVariable UUID id, @RequestBody PurchaseGoal.Details body) {
		return Resource.of(service.updatePurchase(id, body));
	}

	@DeleteMapping("/purchases/{id}")
	ResponseEntity<Void> deletePurchase(@PathVariable UUID id) {
		service.deletePurchase(id);
		return ResponseEntity.noContent().build();
	}

}
