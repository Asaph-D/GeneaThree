package com.example.geneatree.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tree_membership", uniqueConstraints = @UniqueConstraint(columnNames = { "tree_id", "user_id" }))
public class TreeMembership {
    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tree_id", nullable = false)
    private FamilyTree tree;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TreeAccessRole role;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void initialize() {
        if (id == null || id.isBlank()) id = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = Instant.now();
    }

    public String getId() { return id; }
    public FamilyTree getTree() { return tree; }
    public void setTree(FamilyTree tree) { this.tree = tree; }
    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }
    public TreeAccessRole getRole() { return role; }
    public void setRole(TreeAccessRole role) { this.role = role; }
    public Instant getCreatedAt() { return createdAt; }
}
