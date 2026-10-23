package com.example.geneatree.controller;

import com.example.geneatree.dto.LifeEventDTO;
import com.example.geneatree.dto.PersonDTO;
import com.example.geneatree.service.PersonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/people")
public class PersonController {

    @Autowired
    private PersonService personService;

    @GetMapping
    public List<PersonDTO> getAllPeople() {
        return personService.getAllPeople();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PersonDTO> getPersonById(@PathVariable String id) {
        return ResponseEntity.ok(personService.getPersonById(id));
    }

    @PostMapping
    public PersonDTO createPerson(@RequestBody PersonDTO personDTO) {
        return personService.createPerson(personDTO);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PersonDTO> updatePerson(@PathVariable String id, @RequestBody PersonDTO personDTO) {
        return ResponseEntity.ok(personService.updatePerson(id, personDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePerson(@PathVariable String id) {
        personService.deletePerson(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/parents")
    public List<PersonDTO> getParents(@PathVariable String id) {
        return personService.getParentsOf(id);
    }

    @GetMapping("/{id}/children")
    public List<PersonDTO> getChildren(@PathVariable String id) {
        return personService.getChildrenOf(id);
    }

    @GetMapping("/{id}/spouses")
    public List<PersonDTO> getSpouses(@PathVariable String id) {
        return personService.getSpousesOf(id);
    }

    @GetMapping("/{id}/siblings")
    public List<PersonDTO> getSiblings(@PathVariable String id) {
        return personService.getSiblingsOf(id);
    }

    @GetMapping("/{id}/events")
    public List<LifeEventDTO> getEvents(@PathVariable String id) {
        return personService.getEventsOf(id);
    }
}
