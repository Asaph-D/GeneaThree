package com.example.geneatree.controller;

import com.example.geneatree.dto.FamilySnapshotDTO;
import com.example.geneatree.service.FamilySnapshotService;
import com.example.geneatree.service.TreeAccessService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trees/{treeId}/family")
public class TreeFamilyController {
    private final FamilySnapshotService snapshots;
    private final TreeAccessService access;

    public TreeFamilyController(FamilySnapshotService snapshots, TreeAccessService access) {
        this.snapshots = snapshots;
        this.access = access;
    }

    @GetMapping
    public FamilySnapshotDTO load(@PathVariable String treeId, Authentication authentication) {
        access.requireRead(treeId, authentication.getName());
        return snapshots.load(treeId);
    }

    @PutMapping
    public FamilySnapshotDTO replace(@PathVariable String treeId, Authentication authentication,
            @Valid @RequestBody FamilySnapshotDTO snapshot) {
        access.requireWrite(treeId, authentication.getName());
        return snapshots.replace(treeId, snapshot);
    }

    @DeleteMapping
    public ResponseEntity<Void> clear(@PathVariable String treeId, Authentication authentication) {
        access.requireWrite(treeId, authentication.getName());
        snapshots.clear(treeId);
        return ResponseEntity.noContent().build();
    }
}
