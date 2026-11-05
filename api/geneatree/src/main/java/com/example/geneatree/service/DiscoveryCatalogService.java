package com.example.geneatree.service;

import com.example.geneatree.entity.DiscoverySearchEvent;
import com.example.geneatree.repository.DiscoverySearchEventRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class DiscoveryCatalogService {
    private final ObjectMapper mapper;
    private final DiscoverySearchEventRepository searches;
    private final AdminNotificationService notifications;
    private JsonNode catalog;

    public DiscoveryCatalogService(ObjectMapper mapper, DiscoverySearchEventRepository searches, AdminNotificationService notifications) {
        this.mapper = mapper;
        this.searches = searches;
        this.notifications = notifications;
    }

    @PostConstruct
    void load() throws Exception {
        catalog = mapper.readTree(new ClassPathResource("discovery/popular-trees.json").getInputStream());
    }

    public JsonNode categories() { return catalog.path("categories"); }

    public List<JsonNode> search(String query, String category, boolean featuredOnly, int limit) {
        String needle = normalize(query);
        List<JsonNode> matches = new ArrayList<>();
        catalog.path("entries").forEach(entry -> {
            if (category != null && !category.isBlank() && !category.equals(entry.path("category").asText())) return;
            if (featuredOnly && !entry.path("featured").asBoolean()) return;
            String searchable = entry.path("title").asText() + " " + entry.path("description").asText() + " " + entry.path("aliases").toString();
            if (!needle.isBlank() && !normalize(searchable).contains(needle)) return;
            matches.add(summary(entry));
        });
        matches.sort(Comparator.comparing((JsonNode item) -> !item.path("featured").asBoolean()).thenComparing(item -> item.path("title").asText()));
        return matches.stream().limit(Math.max(1, Math.min(limit, 100))).toList();
    }

    public List<JsonNode> suggestions(String query) { return search(query, null, false, 7); }

    public JsonNode tree(String id) {
        for (JsonNode entry : catalog.path("entries")) if (entry.path("id").asText().equals(id)) return entry;
        throw new ResourceNotFoundException("Popular tree", id);
    }

    @Transactional
    public void recordMiss(String query, String category) {
        String cleaned = query == null ? "" : query.trim();
        if (cleaned.length() < 2 || !search(cleaned, category, false, 1).isEmpty()) return;
        DiscoverySearchEvent event = new DiscoverySearchEvent();
        event.setQuery(cleaned.substring(0, Math.min(cleaned.length(), 180)));
        event.setCategory(category == null || category.isBlank() ? null : category);
        event.setFound(false);
        searches.save(event);
        notifications.emptyDiscoverySearch(event.getQuery(), event.getCategory());
    }

    private JsonNode summary(JsonNode entry) {
        ObjectNode copy = (ObjectNode) entry.deepCopy();
        copy.remove("tree");
        return copy;
    }

    private String normalize(String value) {
        if (value == null) return "";
        return Normalizer.normalize(value, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT).trim();
    }
}
