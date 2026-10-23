package com.example.geneatree.service;

import com.example.geneatree.converter.MarriageConverter;
import com.example.geneatree.dto.MarriageDTO;
import com.example.geneatree.entity.Marriage;
import com.example.geneatree.repository.MarriageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MarriageService {

    @Autowired
    private MarriageRepository marriageRepository;

    @Autowired
    private MarriageConverter marriageConverter;

    public MarriageDTO createMarriage(MarriageDTO dto) {
        Marriage marriage = marriageConverter.convertToEntity(dto);
        return marriageConverter.convertToDTO(marriageRepository.save(marriage));
    }

    public List<MarriageDTO> getAllMarriages() {
        return marriageRepository.findAll().stream()
                .map(marriageConverter::convertToDTO)
                .collect(Collectors.toList());
    }

    public MarriageDTO getMarriageById(String id) {
        return marriageRepository.findById(id)
                .map(marriageConverter::convertToDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Marriage", id));
    }

    public MarriageDTO updateMarriage(String id, MarriageDTO dto) {
        if (!marriageRepository.existsById(id)) throw new ResourceNotFoundException("Marriage", id);
        Marriage updated = marriageConverter.convertToEntity(dto);
        updated.setId(id);
        return marriageConverter.convertToDTO(marriageRepository.save(updated));
    }

    public List<MarriageDTO> getMarriagesByPerson(String personId) {
        return marriageRepository.findBySpouse1IdOrSpouse2Id(personId, personId)
            .stream()
            .map(marriageConverter::convertToDTO)
            .toList();
    }

    public void deleteMarriage(String id) {
        if (!marriageRepository.existsById(id)) throw new ResourceNotFoundException("Marriage", id);
        marriageRepository.deleteById(id);
    }
}
