package com.example.geneatree.converter;

import com.example.geneatree.dto.LifeEventDTO;
import com.example.geneatree.entity.LifeEvent;
import com.example.geneatree.entity.Person;
import com.example.geneatree.repository.PersonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class LifeEventConverter {

    @Autowired
    private PersonRepository personRepository;

    public LifeEventDTO convertToDTO(LifeEvent lifeEvent) {
        LifeEventDTO dto = new LifeEventDTO();
        dto.setId(lifeEvent.getId());
        dto.setType(lifeEvent.getType());
        dto.setDate(lifeEvent.getDate());
        dto.setLocation(lifeEvent.getLocation());
        dto.setDescription(lifeEvent.getDescription());
        dto.setRelatedPersonIds(
                lifeEvent.getRelatedPersons().stream().map(Person::getId).collect(Collectors.toList())
        );
        return dto;
    }

    public LifeEvent convertToEntity(LifeEventDTO dto) {
        LifeEvent event = new LifeEvent();
        event.setId(dto.getId());
        event.setType(dto.getType());
        event.setDate(dto.getDate());
        event.setLocation(dto.getLocation());
        event.setDescription(dto.getDescription());
        event.setRelatedPersons(dto.getRelatedPersonIds() == null
                ? List.of()
                : personRepository.findAllById(dto.getRelatedPersonIds()));
        return event;
    }
}
