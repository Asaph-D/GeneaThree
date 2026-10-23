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
@Table(name = "marriage")
public class Marriage {

    @Id
    private String id;

    @PrePersist
    void assignId() {
        if (id == null || id.isBlank()) id = UUID.randomUUID().toString();
    }

    @ManyToOne
    @JoinColumn(name = "spouse1_id")
    private Person spouse1;

    @ManyToOne
    @JoinColumn(name = "spouse2_id")
    private Person spouse2;

    private String marriageDate;
    private String divorceDate;
    private String location;

    @ManyToOne
    @JoinColumn(name = "event_id")
    private LifeEvent event;

    @ManyToMany
    @JoinTable(
        name = "marriage_children_ids",
        joinColumns = @JoinColumn(name = "marriage_id"),
        inverseJoinColumns = @JoinColumn(name = "children_ids")
    )
    @JsonIgnore
    private List<Person> children;
}
