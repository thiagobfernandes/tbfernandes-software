package com.tbfernandes.api.shared.infrastructure.web;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.tbfernandes.api.shared.domain.BusinessRuleViolation;
import com.tbfernandes.api.shared.domain.Conflict;
import com.tbfernandes.api.shared.domain.NotFound;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Errors as RFC 9457 Problem Details, the shape web/src/lib/api/client.ts reads.
 * Field errors go in "errors", keyed by field name.
 */
@RestControllerAdvice
class ApiExceptionHandler {

	@ExceptionHandler(NotFound.class)
	ProblemDetail notFound(NotFound ex) {
		return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
	}

	@ExceptionHandler(Conflict.class)
	ProblemDetail conflict(Conflict ex) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
		problem.setTitle("Conflict");
		problem.setProperty("rule", ex.rule());
		return problem;
	}

	/** RNF-CONF-01: someone else changed the record first. */
	@ExceptionHandler(OptimisticLockingFailureException.class)
	ProblemDetail staleVersion(OptimisticLockingFailureException ex) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
				"The record was changed by another request; reload and try again");
		problem.setTitle("Conflict");
		return problem;
	}

	/** A unique key or primary key already taken, e.g. two creates racing with the same client id. */
	@ExceptionHandler(DataIntegrityViolationException.class)
	ProblemDetail integrity(DataIntegrityViolationException ex) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
				"The request conflicts with existing data");
		problem.setTitle("Conflict");
		return problem;
	}

	@ExceptionHandler(BusinessRuleViolation.class)
	ProblemDetail businessRule(BusinessRuleViolation ex) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_CONTENT, ex.getMessage());
		problem.setTitle("Business rule violated");
		problem.setProperty("rule", ex.rule());
		return problem;
	}

	@ExceptionHandler(IllegalArgumentException.class)
	ProblemDetail invalid(IllegalArgumentException ex) {
		return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	ProblemDetail validation(MethodArgumentNotValidException ex) {
		Map<String, List<String>> errors = ex.getBindingResult()
			.getFieldErrors()
			.stream()
			.collect(Collectors.groupingBy(error -> error.getField(),
					Collectors.mapping(error -> error.getDefaultMessage(), Collectors.toList())));
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Invalid request");
		problem.setProperty("errors", errors);
		return problem;
	}

}
