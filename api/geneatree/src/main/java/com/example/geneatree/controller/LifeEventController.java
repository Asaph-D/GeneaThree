package com.example.geneatree.controller;

import com.example.geneatree.dto.LifeEventDTO;
import com.example.geneatree.service.LifeEventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Profile({"demo", "test"})
@RequestMapping("/api/life-events")
public class LifeEventController {

    @Autowired
    private LifeEventService lifeEventService;

    @GetMapping
    public List<LifeEventDTO> getAllLifeEvents() {
        return lifeEventService.getAllLifeEvents();
    }

    @GetMapping("/{id}")
    public ResponseEntity<LifeEventDTO> getLifeEventById(@PathVariable String id) {
        return ResponseEntity.ok(lifeEventService.getLifeEventById(id));
    }

    @PostMapping
    public LifeEventDTO createLifeEvent(@RequestBody LifeEventDTO lifeEventDTO) {
        return lifeEventService.createLifeEvent(lifeEventDTO);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LifeEventDTO> updateLifeEvent(@PathVariable String id, @RequestBody LifeEventDTO lifeEventDTO) {
        return ResponseEntity.ok(lifeEventService.updateLifeEvent(id, lifeEventDTO));
    }

    @GetMapping("/person/{personId}")
    public List<LifeEventDTO> getEventsByPerson(@PathVariable String personId) {
        return lifeEventService.getEventsByPerson(personId);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLifeEvent(@PathVariable String id) {
        lifeEventService.deleteLifeEvent(id);
        return ResponseEntity.noContent().build();
    }
}
