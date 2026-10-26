package com.tbfernandes.api.assistant.adapter.in.web;

import com.tbfernandes.api.assistant.application.AssistantService;
import com.tbfernandes.api.assistant.domain.Answer;
import com.tbfernandes.api.assistant.domain.KnowledgeGraph;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
class AssistantController {

	private final AssistantService service;

	AssistantController(AssistantService service) {
		this.service = service;
	}

	/** AST-01: POST, not GET, because questions can be long and should not end up in access logs. */
	@PostMapping("/assistant/questions")
	Answer ask(@RequestBody QuestionRequest request) {
		return service.ask(request.question());
	}

	/** KNW-05: nodes and edges of the knowledge graph screen. */
	@GetMapping("/graph")
	KnowledgeGraph graph() {
		return service.graph();
	}

	record QuestionRequest(String question) {
	}

}
