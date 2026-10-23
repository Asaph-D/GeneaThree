package com.example.geneatree.service;

import com.example.geneatree.converter.LifeEventConverter;
import com.example.geneatree.dto.LifeEventDTO;
import com.example.geneatree.entity.LifeEvent;
import com.example.geneatree.repository.LifeEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LifeEventService {

    @Autowired
    private LifeEventRepository lifeEventRepository;

    @Autowired
    private LifeEventConverter lifeEventConverter;

    public LifeEventDTO createLifeEvent(LifeEventDTO dto) {
        LifeEvent event = lifeEventConverter.convertToEntity(dto);
        return lifeEventConverter.convertToDTO(lifeEventRepository.save(event));
    }

    public List<LifeEventDTO> getAllLifeEvents() {
        return lifeEventRepository.findAll().stream()
                .map(lifeEventConverter::convertToDTO)
                .collect(Collectors.toList());
    }

    public LifeEventDTO getLifeEventById(String id) {
        return lifeEventRepository.findById(id)
                .map(lifeEventConverter::convertToDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Life event", id));
    }

    public LifeEventDTO updateLifeEvent(String id, LifeEventDTO dto) {
        if (!lifeEventRepository.existsById(id)) throw new ResourceNotFoundException("Life event", id);
        LifeEvent updated = lifeEventConverter.convertToEntity(dto);
        updated.setId(id);
        return lifeEventConverter.convertToDTO(lifeEventRepository.save(updated));
    }

    public List<LifeEventDTO> getEventsByPerson(String personId) {
        return lifeEventRepository.findByRelatedPersonsId(personId)
                .stream()
                .map(lifeEventConverter::convertToDTO)
                .collect(Collectors.toList());
    }

    public void deleteLifeEvent(String id) {
        if (!lifeEventRepository.existsById(id)) throw new ResourceNotFoundException("Life event", id);
        lifeEventRepository.deleteById(id);
    }
}
