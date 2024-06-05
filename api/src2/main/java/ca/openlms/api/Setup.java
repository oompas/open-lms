package ca.openlms.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.function.Function;

@SpringBootApplication
public class Setup {

	public static void main(String[] args) {
		SpringApplication.run(Setup.class, args);
	}

	@Bean
	public Function<String, String> function() {
		return value -> value.toUpperCase();
	}
}
