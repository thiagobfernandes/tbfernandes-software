package com.tbfernandes.api;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * Keeps the architecture honest (docs/backend/arquitetura.md):
 * module boundaries via Spring Modulith, and the clean architecture dependency rule via ArchUnit.
 */
class ArchitectureTests {

	private static final ApplicationModules MODULES = ApplicationModules.of(TbfernandesApiApplication.class);

	private static final JavaClasses CLASSES = new ClassFileImporter()
		.withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
		.importPackages("com.tbfernandes.api");

	@Test
	void modulesOnlyUseEachOthersPublicApi() {
		MODULES.verify();
	}

	@Test
	void domainIsPlainJava() {
		noClasses().that()
			.resideInAPackage("..domain..")
			.should()
			.dependOnClassesThat()
			.resideInAnyPackage("org.springframework..", "jakarta.persistence..", "org.hibernate..", "..application..",
					"..adapter..")
			.check(CLASSES);
	}

	@Test
	void applicationDoesNotKnowAdapters() {
		noClasses().that()
			.resideInAPackage("..application..")
			.should()
			.dependOnClassesThat()
			.resideInAnyPackage("..adapter..", "jakarta.persistence..", "org.springframework.web..")
			.check(CLASSES);
	}

	/** Writes module diagrams (PlantUML/C4) to target/spring-modulith-docs. */
	@Test
	void writeModuleDocumentation() {
		new Documenter(MODULES).writeDocumentation();
	}

}
