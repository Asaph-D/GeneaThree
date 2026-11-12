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
import java.time.Instant;
import com.example.geneatree.entity.DiscoveryTreeContent;
import com.example.geneatree.repository.DiscoveryTreeContentRepository;
import org.springframework.security.access.AccessDeniedException;

@Service
public class DiscoveryCatalogService {
    private final ObjectMapper mapper;
    private final DiscoverySearchEventRepository searches;
    private final AdminNotificationService notifications;
    private JsonNode catalog;
    public static final String EDITOR_EMAIL = "kouokamasaph142@gmail.com";
    private final DiscoveryTreeContentRepository contents;
    private final FamilySnapshotService snapshots;

    public DiscoveryCatalogService(ObjectMapper mapper, DiscoverySearchEventRepository searches, AdminNotificationService notifications, DiscoveryTreeContentRepository contents, FamilySnapshotService snapshots) {
        this.mapper = mapper;
        this.searches = searches;
        this.notifications = notifications;
        this.contents = contents;
        this.snapshots = snapshots;
    }

    @PostConstruct
    void load() throws Exception {
        catalog = mapper.readTree(new ClassPathResource("discovery/popular-trees.json").getInputStream());
        for (var stored : contents.findAll()) {
            ObjectNode entry = findEntry(stored.getId());
            applyContent(entry, mapper.readTree(stored.getContent()));
        }
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
        return findEntry(id).deepCopy();
    }

    private ObjectNode findEntry(String id) {
        for (JsonNode entry : catalog.path("entries")) if (entry.path("id").asText().equals(id)) return (ObjectNode) entry;
        throw new ResourceNotFoundException("Popular tree", id);
    }

    @Transactional
    public synchronized JsonNode updateTree(String id, JsonNode tree, String email) {
        if (!EDITOR_EMAIL.equalsIgnoreCase(email)) throw new AccessDeniedException("Only the catalogue owner can modify predefined trees");
        ObjectNode entry = findEntry(id);
        if (!tree.path("persons").isArray() || tree.path("persons").isEmpty() || !tree.path("marriages").isArray())
            throw new IllegalArgumentException("A tree requires persons and marriages arrays");
        String focus = tree.path("view").path("focusPersonId").asText();
        boolean found = false;
        var ids = new java.util.HashSet<String>();
        for (var person : tree.path("persons")) {
            String personId = person.path("id").asText();
            if (personId.isBlank() || !ids.add(personId)) throw new IllegalArgumentException("Invalid or duplicate person id");
            if (personId.equals(focus)) found = true;
        }
        if (!found) throw new IllegalArgumentException("The focus person must belong to the tree");
        if (!focus.equals(entry.path("tree").path("view").path("focusPersonId").asText()))
            throw new IllegalArgumentException("The catalogue subject must remain the focus person");
        ObjectNode snapshot = (ObjectNode) tree.deepCopy();
        snapshot.remove("view");
        for (var person : snapshot.path("persons")) {
            normalizePlace((ObjectNode) person, "birthPlace");
            normalizePlace((ObjectNode) person, "deathPlace");
        }
        for (var marriage : snapshot.path("marriages")) normalizePlace((ObjectNode) marriage, "location");
        snapshots.validate(mapper.convertValue(snapshot, com.example.geneatree.dto.FamilySnapshotDTO.class));
        DiscoveryTreeContent stored = contents.findById(id).orElseGet(DiscoveryTreeContent::new);
        stored.setId(id);
        stored.setContent(tree.toString());
        stored.setUpdatedAt(Instant.now());
        contents.saveAndFlush(stored);
        applyContent(entry, tree);
        return entry.deepCopy();
    }

    private void applyContent(ObjectNode entry, JsonNode tree) {
        entry.set("tree", tree.deepCopy());
        entry.put("personCount", tree.path("persons").size());
        entry.put("generations", tree.path("view").path("generations").asInt(4));
        for (var person : tree.path("persons")) {
            if (person.path("id").asText().equals(tree.path("view").path("focusPersonId").asText())) {
                entry.set("imageUrl", person.path("photoUrl").deepCopy());
                break;
            }
        }
    }

    private void normalizePlace(ObjectNode item, String field) {
        JsonNode place = item.path(field);
        if (place.isObject()) item.put(field, java.util.stream.Stream.of("city", "region", "country")
                .map(key -> place.path(key).asText()).filter(value -> !value.isBlank()).collect(java.util.stream.Collectors.joining(", ")));
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
