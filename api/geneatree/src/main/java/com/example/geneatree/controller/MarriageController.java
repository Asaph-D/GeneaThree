package com.example.geneatree.controller;

import com.example.geneatree.dto.MarriageDTO;
import com.example.geneatree.service.MarriageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/marriages")
public class MarriageController {

    @Autowired
    private MarriageService marriageService;

    @GetMapping
    public List<MarriageDTO> getAllMarriages() {
        return marriageService.getAllMarriages();
    }

    @GetMapping("/{id}")
    public ResponseEntity<MarriageDTO> getMarriageById(@PathVariable String id) {
        return ResponseEntity.ok(marriageService.getMarriageById(id));
    }

    @PostMapping
    public MarriageDTO createMarriage(@RequestBody MarriageDTO marriageDTO) {
        return marriageService.createMarriage(marriageDTO);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MarriageDTO> updateMarriage(@PathVariable String id, @RequestBody MarriageDTO marriageDTO) {
        return ResponseEntity.ok(marriageService.updateMarriage(id, marriageDTO));
    }

    @GetMapping("/person/{personId}")
    public List<MarriageDTO> getMarriagesByPerson(@PathVariable String personId) {
        return marriageService.getMarriagesByPerson(personId);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMarriage(@PathVariable String id) {
        marriageService.deleteMarriage(id);
        return ResponseEntity.noContent().build();
    }
}
