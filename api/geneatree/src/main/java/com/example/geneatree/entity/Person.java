package com.example.geneatree.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "person")
public class Person {

    @Id
    private String id;

    @Column(name = "client_id")
    private String clientId;

    @Column(name = "snapshot_order")
    private Integer snapshotOrder;

    @PrePersist
    void assignId() {
        if (id == null || id.isBlank()) id = UUID.randomUUID().toString();
    }

    private String firstName;
    private String lastName;
    private String birthDate;
    private String birthPlace;
    private String deathDate;
    private String deathPlace;
    private String gender;
    private String occupation;
    private boolean deceased;
    @Column(columnDefinition = "text")
    private String photoUrl;
    @Column(columnDefinition = "text")
    private String biography;
    @Column(columnDefinition = "text")
    private String notes;
    private String email;
    private String phone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tree_id")
    @JsonIgnore
    private FamilyTree tree;

    @ManyToMany
    @JoinTable(
        name = "person_parent_ids",
        joinColumns = @JoinColumn(name = "person_id"),
        inverseJoinColumns = @JoinColumn(name = "parent_ids")
    )
    private List<Person> parents;

    @ManyToMany(mappedBy = "parents")
    @OrderBy("snapshotOrder ASC, id ASC")
    @JsonIgnore
    private List<Person> children;

    @ManyToMany
    @JoinTable(
        name = "person_spouse_ids",
        joinColumns = @JoinColumn(name = "person_id"),
        inverseJoinColumns = @JoinColumn(name = "spouse_ids")
    )
    private List<Person> spouses;

    @ManyToMany
    @JoinTable(
        name = "person_sibling_ids",
        joinColumns = @JoinColumn(name = "person_id"),
        inverseJoinColumns = @JoinColumn(name = "sibling_ids")
    )
    private List<Person> siblings;

    @ManyToMany
    @JoinTable(
        name = "person_event_ids",
        joinColumns = @JoinColumn(name = "person_id"),
        inverseJoinColumns = @JoinColumn(name = "event_ids")
    )
    private List<LifeEvent> events;
}
