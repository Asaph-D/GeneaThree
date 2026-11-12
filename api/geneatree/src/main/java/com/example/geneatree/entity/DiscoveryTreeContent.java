package com.example.geneatree.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "discovery_tree_content")
public class DiscoveryTreeContent {
    @Id private String id;
    @Column(nullable = false, columnDefinition = "text") private String content;
    @Column(nullable = false) private Instant updatedAt;
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
