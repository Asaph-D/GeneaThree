package com.example.geneatree.service;

import com.example.geneatree.converter.LifeEventConverter;
import com.example.geneatree.converter.PersonConverter;
import com.example.geneatree.dto.LifeEventDTO;
import com.example.geneatree.dto.PersonDTO;
import com.example.geneatree.entity.Person;
import com.example.geneatree.repository.PersonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PersonService {

    @Autowired
    private PersonRepository personRepository;

    @Autowired
    private PersonConverter personConverter;

    @Autowired
    private LifeEventConverter lifeEventConverter;

    public List<PersonDTO> getAllPeople() {
        return personRepository.findAll()
                .stream()
                .map(personConverter::convertToDTO)
                .collect(Collectors.toList());
    }

    public PersonDTO getPersonById(String id) {
        return personRepository.findById(id)
                .map(personConverter::convertToDTO)
                .orElseThrow(() -> new RuntimeException("Person not found"));
    }

    public PersonDTO createPerson(PersonDTO personDTO) {
        Person person = personConverter.convertToEntity(personDTO);
        return personConverter.convertToDTO(personRepository.save(person));
    }

    public PersonDTO updatePerson(String id, PersonDTO personDTO) {
        if (!personRepository.existsById(id)) {
            throw new RuntimeException("Person not found");
        }
        personDTO.setId(id);
        Person person = personConverter.convertToEntity(personDTO);
        return personConverter.convertToDTO(personRepository.save(person));
    }

    public void deletePerson(String id) {
        personRepository.deleteById(id);
    }

    public List<PersonDTO> getParentsOf(String id) {
        Person person = personRepository.findById(id).orElseThrow(() -> new RuntimeException("Person not found"));
        return person.getParents().stream().map(personConverter::convertToDTO).toList();
    }

    public List<PersonDTO> getChildrenOf(String id) {
        Person person = personRepository.findById(id).orElseThrow(() -> new RuntimeException("Person not found"));
        return person.getChildren().stream().map(personConverter::convertToDTO).toList();
    }

    public List<PersonDTO> getSpousesOf(String id) {
        Person person = personRepository.findById(id).orElseThrow(() -> new RuntimeException("Person not found"));
        return person.getSpouses().stream().map(personConverter::convertToDTO).toList();
    }

    public List<PersonDTO> getSiblingsOf(String id) {
        Person person = personRepository.findById(id).orElseThrow(() -> new RuntimeException("Person not found"));
        return person.getSiblings().stream().map(personConverter::convertToDTO).toList();
    }

    public List<LifeEventDTO> getEventsOf(String id) {
        Person person = personRepository.findById(id).orElseThrow(() -> new RuntimeException("Person not found"));
        return person.getEvents().stream().map(lifeEventConverter::convertToDTO).toList();
    }
} 
