package com.tbfernandes.api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

/** Boots the app on a fresh database: all migrations and the dev seed apply, and JPA validates the schema. */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("dev")
class TbfernandesApiApplicationTests {

	@Test
	void contextLoads() {
	}

}
