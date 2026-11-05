package com.example.geneatree.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "discovery_search_event")
public class DiscoverySearchEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 180) private String query;
    @Column(nullable = false) private boolean found;
    @Column(length = 80) private String category;
    @Column(nullable = false, updatable = false) private Instant createdAt;

    @PrePersist void initialize() { if (createdAt == null) createdAt = Instant.now(); }
    public Long getId() { return id; }
    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }
    public boolean isFound() { return found; }
    public void setFound(boolean found) { this.found = found; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Instant getCreatedAt() { return createdAt; }
}
