package com.example.geneatree.controller;

import com.example.geneatree.service.DiscoveryCatalogService;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/discovery")
public class DiscoveryController {
    private final DiscoveryCatalogService catalog;
    public DiscoveryController(DiscoveryCatalogService catalog) { this.catalog = catalog; }

    @GetMapping("/categories") public JsonNode categories() { return catalog.categories(); }
    @GetMapping("/trees") public List<JsonNode> trees(@RequestParam(defaultValue = "") String q, @RequestParam(required = false) String category, @RequestParam(defaultValue = "false") boolean featured, @RequestParam(defaultValue = "24") int limit) { return catalog.search(q, category, featured, limit); }
    @GetMapping("/suggestions") public List<JsonNode> suggestions(@RequestParam String q) { return catalog.suggestions(q); }
    @GetMapping("/trees/{id}") public JsonNode tree(@PathVariable String id) { return catalog.tree(id); }
    @PostMapping("/search-misses") public void miss(@Valid @RequestBody SearchMissRequest request) { catalog.recordMiss(request.query(), request.category()); }
    public record SearchMissRequest(@NotBlank String query, String category) {}
}
