package com.tbfernandes.api.work.web;

import com.tbfernandes.api.work.application.dashboard.WorkSummary;
import com.tbfernandes.api.work.application.dashboard.WorkSummaryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
class DashboardController {

	private final WorkSummaryService service;

	DashboardController(WorkSummaryService service) {
		this.service = service;
	}

	@GetMapping("/summary")
	WorkSummary summary() {
		return service.summary();
	}

}
