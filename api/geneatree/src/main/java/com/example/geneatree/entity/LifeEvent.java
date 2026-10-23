package com.example.geneatree.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "life_event")
public class LifeEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String type;
    private String date;
    private String location;
    private String description;

    @ManyToMany
    @JoinTable(
        name = "life_event_related_person_ids",
        joinColumns = @JoinColumn(name = "life_event_id"),
        inverseJoinColumns = @JoinColumn(name = "person_ids")
    )
    private List<Person> relatedPersons;
}