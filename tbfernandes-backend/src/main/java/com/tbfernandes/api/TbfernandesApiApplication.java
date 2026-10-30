package com.tbfernandes.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.modulith.Modulithic;

@Modulithic(systemName = "TBFernandes Software", sharedModules = "shared")
@SpringBootApplication
@ConfigurationPropertiesScan
public class TbfernandesApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(TbfernandesApiApplication.class, args);
	}

}
