package com.example.geneatree;

import com.example.geneatree.config.DatabaseUrlEnvironmentPostProcessor;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.mock.env.MockEnvironment;

import java.io.IOException;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DatabaseUrlEnvironmentPostProcessorTests {
    private final DatabaseUrlEnvironmentPostProcessor processor = new DatabaseUrlEnvironmentPostProcessor();

    @Test
    void convertsSupabaseUrlAndExtractsCredentials() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("POSTGRES_URL", "postgres://postgres.project:secret@pooler.example.com:6543/postgres?sslmode=require");

        processor.postProcessEnvironment(environment, new SpringApplication());

        assertThat(environment.getProperty("spring.datasource.url"))
                .isEqualTo("jdbc:postgresql://pooler.example.com:6543/postgres?sslmode=require");
        assertThat(environment.getProperty("spring.datasource.username")).isEqualTo("postgres.project");
        assertThat(environment.getProperty("spring.datasource.password")).isEqualTo("secret");
    }

    @Test
    void failsClearlyWhenRenderHasNoDatabaseConfiguration() {
        MockEnvironment environment = new MockEnvironment().withProperty("RENDER", "true");

        assertThatThrownBy(() -> processor.postProcessEnvironment(environment, new SpringApplication()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("PostgreSQL is not configured on Render");
    }

    @Test
    void isRegisteredForAutomaticSpringBootDiscovery() throws IOException {
        Properties factories = new Properties();
        try (var stream = getClass().getClassLoader().getResourceAsStream("META-INF/spring.factories")) {
            assertThat(stream).as("META-INF/spring.factories must be packaged").isNotNull();
            factories.load(stream);
        }

        assertThat(factories.getProperty("org.springframework.boot.env.EnvironmentPostProcessor"))
                .contains(DatabaseUrlEnvironmentPostProcessor.class.getName());
    }
}
