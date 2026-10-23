package com.example.geneatree.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {
    private static final String[] CANDIDATES = {
            "DB_URL", "POSTGRES_URL_NON_POOLING", "POSTGRES_URL", "SUPABASE_DB_URL", "DATABASE_URL"
    };

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String rawUrl = firstConfigured(environment);
        if (rawUrl == null) {
            if (Boolean.parseBoolean(environment.getProperty("RENDER", "false"))) {
                throw new IllegalStateException("PostgreSQL is not configured on Render. Set DB_URL or POSTGRES_URL.");
            }
            return;
        }

        Map<String, Object> properties = new LinkedHashMap<>();
        if (rawUrl.startsWith("jdbc:")) {
            properties.put("spring.datasource.url", rawUrl);
        } else if (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://")) {
            URI uri = URI.create(rawUrl);
            String query = uri.getRawQuery();
            String jdbcUrl = "jdbc:postgresql://" + uri.getHost()
                    + (uri.getPort() > 0 ? ":" + uri.getPort() : "")
                    + (uri.getRawPath() == null ? "" : uri.getRawPath())
                    + (query == null || query.isBlank() ? "" : "?" + query);
            properties.put("spring.datasource.url", jdbcUrl);
            applyCredentials(uri, properties, environment);
        } else {
            throw new IllegalStateException("Unsupported PostgreSQL URL. Expected jdbc:postgresql:// or postgres://");
        }
        environment.getPropertySources().addFirst(new MapPropertySource("normalizedDatabaseUrl", properties));
    }

    private String firstConfigured(ConfigurableEnvironment environment) {
        for (String key : CANDIDATES) {
            String value = environment.getProperty(key);
            if (value != null && !value.isBlank()) return value.trim();
        }
        return null;
    }

    private void applyCredentials(URI uri, Map<String, Object> properties, ConfigurableEnvironment environment) {
        if (uri.getRawUserInfo() == null || uri.getRawUserInfo().isBlank()) return;
        String[] credentials = uri.getRawUserInfo().split(":", 2);
        if (isBlank(environment.getProperty("DB_USERNAME")) && credentials.length > 0) {
            properties.put("spring.datasource.username", decode(credentials[0]));
        }
        if (isBlank(environment.getProperty("DB_PASSWORD")) && credentials.length > 1) {
            properties.put("spring.datasource.password", decode(credentials[1]));
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
