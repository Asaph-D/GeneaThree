// PersonConverter.java
package com.example.geneatree.converter;

import com.example.geneatree.dto.PersonDTO;
import com.example.geneatree.entity.Person;
import com.example.geneatree.repository.LifeEventRepository;
import com.example.geneatree.repository.PersonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class PersonConverter {

    @Autowired
    private PersonRepository personRepository;

    @Autowired
    private LifeEventRepository lifeEventRepository;

    public PersonDTO convertToDTO(Person person) {
        PersonDTO dto = new PersonDTO();
        dto.setId(person.getId());
        dto.setFirstName(person.getFirstName());
        dto.setLastName(person.getLastName());
        dto.setBirthDate(person.getBirthDate());
        dto.setBirthPlace(person.getBirthPlace());
        dto.setDeathDate(person.getDeathDate());
        dto.setDeathPlace(person.getDeathPlace());
        dto.setGender(person.getGender());
        dto.setOccupation(person.getOccupation());
        dto.setDeceased(person.isDeceased());
        dto.setPhotoUrl(person.getPhotoUrl());
        dto.setBiography(person.getBiography());
        dto.setNotes(person.getNotes());
        dto.setEmail(person.getEmail());
        dto.setPhone(person.getPhone());

        dto.setParentIds(person.getParents().stream().map(Person::getId).collect(Collectors.toList()));
        dto.setChildrenIds(person.getChildren().stream().map(Person::getId).collect(Collectors.toList()));
        dto.setSpouseIds(person.getSpouses().stream().map(Person::getId).collect(Collectors.toList()));
        dto.setSiblingIds(person.getSiblings().stream().map(Person::getId).collect(Collectors.toList()));
        dto.setEventIds(person.getEvents().stream().map(e -> e.getId()).collect(Collectors.toList()));

        return dto;
    }

    public Person convertToEntity(PersonDTO dto) {
        Person person = new Person();
        person.setId(dto.getId());
        person.setFirstName(dto.getFirstName());
        person.setLastName(dto.getLastName());
        person.setBirthDate(dto.getBirthDate());
        person.setBirthPlace(dto.getBirthPlace());
        person.setDeathDate(dto.getDeathDate());
        person.setDeathPlace(dto.getDeathPlace());
        person.setGender(dto.getGender());
        person.setOccupation(dto.getOccupation());
        person.setDeceased(dto.isDeceased());
        person.setPhotoUrl(dto.getPhotoUrl());
        person.setBiography(dto.getBiography());
        person.setNotes(dto.getNotes());
        person.setEmail(dto.getEmail());
        person.setPhone(dto.getPhone());

        person.setParents(dto.getParentIds() == null ? List.of() : personRepository.findAllById(dto.getParentIds()));
        person.setChildren(dto.getChildrenIds() == null ? List.of() : personRepository.findAllById(dto.getChildrenIds()));
        person.setSpouses(dto.getSpouseIds() == null ? List.of() : personRepository.findAllById(dto.getSpouseIds()));
        person.setSiblings(dto.getSiblingIds() == null ? List.of() : personRepository.findAllById(dto.getSiblingIds()));
        person.setEvents(dto.getEventIds() == null ? List.of() : lifeEventRepository.findAllById(dto.getEventIds()));

        return person;
    }
}
