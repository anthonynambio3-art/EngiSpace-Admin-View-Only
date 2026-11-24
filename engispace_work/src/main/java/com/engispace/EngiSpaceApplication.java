package com.engispace;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EngiSpaceApplication {

	public static void main(String[] args) {
		SpringApplication.run(EngiSpaceApplication.class, args);
	}

}
