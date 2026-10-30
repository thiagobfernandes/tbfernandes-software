package com.tbfernandes.api.knowledge.application;

import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.knowledge.domain.method.Method;
import com.tbfernandes.api.knowledge.domain.method.Method.MethodDetails;
import com.tbfernandes.api.knowledge.domain.method.MethodRepository;
import com.tbfernandes.api.shared.application.OwnerContext;
import com.tbfernandes.api.shared.domain.NotFound;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Working method use cases (RF-KNW-06). */
@Service
@Transactional
public class MethodService {

	private final MethodRepository methods;
	private final OwnerContext owner;

	MethodService(MethodRepository methods, OwnerContext owner) {
		this.methods = methods;
		this.owner = owner;
	}

	public Method create(MethodDetails details) {
		return methods.save(Method.create(owner.currentOwnerId(), details));
	}

	public Method update(UUID id, MethodDetails details) {
		Method method = get(id);
		method.update(details);
		return methods.save(method);
	}

	public void delete(UUID id) {
		methods.delete(get(id));
	}

	@Transactional(readOnly = true)
	public Method get(UUID id) {
		return methods.findById(owner.currentOwnerId(), id).orElseThrow(() -> new NotFound("Method", id));
	}

	@Transactional(readOnly = true)
	public List<Method> list() {
		return methods.findAll(owner.currentOwnerId());
	}

}
