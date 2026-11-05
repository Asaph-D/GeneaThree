package com.example.geneatree.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tree_invitation", uniqueConstraints = @UniqueConstraint(columnNames = { "tree_id", "email" }))
public class TreeInvitation {
    @Id private String id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "tree_id", nullable = false)
    private FamilyTree tree;
    @Column(nullable = false, length = 320) private String email;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private TreeAccessRole role;
    @Column(nullable = false, unique = true, length = 64) private String token;
    @Column(nullable = false, updatable = false) private Instant createdAt;
    @Column(nullable = false) private Instant expiresAt;
    @PrePersist void initialize() {
        if (id == null) id = UUID.randomUUID().toString();
        if (token == null) token = UUID.randomUUID().toString().replace("-", "");
        if (createdAt == null) createdAt = Instant.now();
        if (expiresAt == null) expiresAt = Instant.now().plusSeconds(60L * 60 * 24 * 14);
    }
    public String getId() { return id; }
    public FamilyTree getTree() { return tree; }
    public void setTree(FamilyTree tree) { this.tree = tree; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public TreeAccessRole getRole() { return role; }
    public void setRole(TreeAccessRole role) { this.role = role; }
    public String getToken() { return token; }
    public Instant getExpiresAt() { return expiresAt; }
}
