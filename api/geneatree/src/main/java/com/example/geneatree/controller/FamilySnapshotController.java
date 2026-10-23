package com.example.geneatree.controller;

import com.example.geneatree.dto.FamilySnapshotDTO;
import com.example.geneatree.service.FamilySnapshotService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/family")
public class FamilySnapshotController {
    private final FamilySnapshotService familySnapshotService;

    public FamilySnapshotController(FamilySnapshotService familySnapshotService) {
        this.familySnapshotService = familySnapshotService;
    }

    @GetMapping
    public FamilySnapshotDTO load() {
        return familySnapshotService.load();
    }

    @PutMapping
    public FamilySnapshotDTO replace(@Valid @RequestBody FamilySnapshotDTO snapshot) {
        return familySnapshotService.replace(snapshot);
    }

    @DeleteMapping
    public ResponseEntity<Void> clear() {
        familySnapshotService.clear();
        return ResponseEntity.noContent().build();
    }
}

