package com.tbfernandes.api.learning.adapter.in.web;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import com.tbfernandes.api.learning.application.LearningService;
import com.tbfernandes.api.learning.domain.Certification;
import com.tbfernandes.api.learning.domain.Education;
import com.tbfernandes.api.learning.domain.Material;
import com.tbfernandes.api.learning.domain.Skill;
import com.tbfernandes.api.learning.domain.Study;
import com.tbfernandes.api.shared.infrastructure.web.Resource;
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

/**
 * REST for the learning collections. Request bodies are the domain details records, and
 * responses are {id + details}, the same shape as web/src/features/learning/types. Field
 * rules are checked by the domain and answered as 400/422 Problem Details.
 */
@RestController
@RequestMapping("/api/v1")
class LearningController {

	private final LearningService service;

	LearningController(LearningService service) {
		this.service = service;
	}

	// studies

	@GetMapping("/studies")
	List<Resource<Study.Details>> listStudy() {
		return service.listStudies().stream().map(Resource::of).toList();
	}

	@GetMapping("/studies/{id}")
	Resource<Study.Details> getStudy(@PathVariable UUID id) {
		return Resource.of(service.study(id));
	}

	@PostMapping("/studies")
	ResponseEntity<Resource<Study.Details>> createStudy(@RequestBody Study.Details body) {
		Study created = service.createStudy(body);
		return ResponseEntity.created(URI.create("/api/v1/studies/" + created.id())).body(Resource.of(created));
	}

	@PutMapping("/studies/{id}")
	Resource<Study.Details> updateStudy(@PathVariable UUID id, @RequestBody Study.Details body) {
		return Resource.of(service.updateStudy(id, body));
	}

	@DeleteMapping("/studies/{id}")
	ResponseEntity<Void> deleteStudy(@PathVariable UUID id) {
		service.deleteStudy(id);
		return ResponseEntity.noContent().build();
	}

	// materials

	@GetMapping("/materials")
	List<Resource<Material.Details>> listMaterial(@RequestParam(required = false) UUID studyId) {
		return service.listMaterials(studyId).stream().map(Resource::of).toList();
	}

	@GetMapping("/materials/{id}")
	Resource<Material.Details> getMaterial(@PathVariable UUID id) {
		return Resource.of(service.material(id));
	}

	@PostMapping("/materials")
	ResponseEntity<Resource<Material.Details>> createMaterial(@RequestBody Material.Details body) {
		Material created = service.createMaterial(body);
		return ResponseEntity.created(URI.create("/api/v1/materials/" + created.id())).body(Resource.of(created));
	}

	@PutMapping("/materials/{id}")
	Resource<Material.Details> updateMaterial(@PathVariable UUID id, @RequestBody Material.Details body) {
		return Resource.of(service.updateMaterial(id, body));
	}

	@DeleteMapping("/materials/{id}")
	ResponseEntity<Void> deleteMaterial(@PathVariable UUID id) {
		service.deleteMaterial(id);
		return ResponseEntity.noContent().build();
	}

	// skills

	@GetMapping("/skills")
	List<Resource<Skill.Details>> listSkill() {
		return service.listSkills().stream().map(Resource::of).toList();
	}

	@GetMapping("/skills/{id}")
	Resource<Skill.Details> getSkill(@PathVariable UUID id) {
		return Resource.of(service.skill(id));
	}

	@PostMapping("/skills")
	ResponseEntity<Resource<Skill.Details>> createSkill(@RequestBody Skill.Details body) {
		Skill created = service.createSkill(body);
		return ResponseEntity.created(URI.create("/api/v1/skills/" + created.id())).body(Resource.of(created));
	}

	@PutMapping("/skills/{id}")
	Resource<Skill.Details> updateSkill(@PathVariable UUID id, @RequestBody Skill.Details body) {
		return Resource.of(service.updateSkill(id, body));
	}

	@DeleteMapping("/skills/{id}")
	ResponseEntity<Void> deleteSkill(@PathVariable UUID id) {
		service.deleteSkill(id);
		return ResponseEntity.noContent().build();
	}

	// certifications

	@GetMapping("/certifications")
	List<Resource<Certification.Details>> listCertification(@RequestParam(required = false) Integer expiringWithinDays) {
		return service.listCertifications(expiringWithinDays).stream().map(Resource::of).toList();
	}

	@GetMapping("/certifications/{id}")
	Resource<Certification.Details> getCertification(@PathVariable UUID id) {
		return Resource.of(service.certification(id));
	}

	@PostMapping("/certifications")
	ResponseEntity<Resource<Certification.Details>> createCertification(@RequestBody Certification.Details body) {
		Certification created = service.createCertification(body);
		return ResponseEntity.created(URI.create("/api/v1/certifications/" + created.id())).body(Resource.of(created));
	}

	@PutMapping("/certifications/{id}")
	Resource<Certification.Details> updateCertification(@PathVariable UUID id, @RequestBody Certification.Details body) {
		return Resource.of(service.updateCertification(id, body));
	}

	@DeleteMapping("/certifications/{id}")
	ResponseEntity<Void> deleteCertification(@PathVariable UUID id) {
		service.deleteCertification(id);
		return ResponseEntity.noContent().build();
	}

	// educations

	@GetMapping("/educations")
	List<Resource<Education.Details>> listEducation() {
		return service.listEducations().stream().map(Resource::of).toList();
	}

	@GetMapping("/educations/{id}")
	Resource<Education.Details> getEducation(@PathVariable UUID id) {
		return Resource.of(service.education(id));
	}

	@PostMapping("/educations")
	ResponseEntity<Resource<Education.Details>> createEducation(@RequestBody Education.Details body) {
		Education created = service.createEducation(body);
		return ResponseEntity.created(URI.create("/api/v1/educations/" + created.id())).body(Resource.of(created));
	}

	@PutMapping("/educations/{id}")
	Resource<Education.Details> updateEducation(@PathVariable UUID id, @RequestBody Education.Details body) {
		return Resource.of(service.updateEducation(id, body));
	}

	@DeleteMapping("/educations/{id}")
	ResponseEntity<Void> deleteEducation(@PathVariable UUID id) {
		service.deleteEducation(id);
		return ResponseEntity.noContent().build();
	}
}
