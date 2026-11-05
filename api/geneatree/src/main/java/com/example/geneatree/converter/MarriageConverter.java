package com.example.geneatree.converter;

import com.example.geneatree.dto.MarriageDTO;
import com.example.geneatree.entity.Marriage;
import com.example.geneatree.entity.Person;
import com.example.geneatree.entity.LifeEvent;
import com.example.geneatree.repository.PersonRepository;
import com.example.geneatree.repository.LifeEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class MarriageConverter {

    @Autowired
    private PersonRepository personRepository;

    @Autowired
    private LifeEventRepository lifeEventRepository;

    public MarriageDTO convertToDTO(Marriage marriage) {
        MarriageDTO dto = new MarriageDTO();
        dto.setId(marriage.getClientId() == null ? marriage.getId() : marriage.getClientId());
        dto.setSpouse1Id(marriage.getSpouse1() != null ? clientId(marriage.getSpouse1()) : null);
        dto.setSpouse2Id(marriage.getSpouse2() != null ? clientId(marriage.getSpouse2()) : null);
        dto.setMarriageDate(marriage.getMarriageDate());
        dto.setDivorceDate(marriage.getDivorceDate());
        dto.setLocation(marriage.getLocation());
        dto.setChildrenIds(marriage.getChildren().stream().map(this::clientId).toList());
        dto.setEventId(marriage.getEvent() != null ? marriage.getEvent().getId() : null);
        return dto;
    }

    public Marriage convertToEntity(MarriageDTO dto) {
        Marriage marriage = new Marriage();
        marriage.setId(dto.getId());
        marriage.setClientId(dto.getId());
        marriage.setSpouse1(dto.getSpouse1Id() != null ? personRepository.findById(dto.getSpouse1Id()).orElse(null) : null);
        marriage.setSpouse2(dto.getSpouse2Id() != null ? personRepository.findById(dto.getSpouse2Id()).orElse(null) : null);
        marriage.setMarriageDate(dto.getMarriageDate());
        marriage.setDivorceDate(dto.getDivorceDate());
        marriage.setLocation(dto.getLocation());
        marriage.setChildren(dto.getChildrenIds() != null ? personRepository.findAllById(dto.getChildrenIds()) : List.of());
        marriage.setEvent(dto.getEventId() != null ? lifeEventRepository.findById(dto.getEventId()).orElse(null) : null);
        return marriage;
    }

    private String clientId(Person person) {
        return person.getClientId() == null ? person.getId() : person.getClientId();
    }
}
