package com.example.geneatree.controller;

import com.example.geneatree.dto.*;
import com.example.geneatree.repository.FamilyTreeRepository;
import com.example.geneatree.service.*;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
public class TreeSharingController {
    private final TreeSharingService sharing;
    private final FamilyTreeRepository trees;
    private final FamilySnapshotService snapshots;
    public TreeSharingController(TreeSharingService sharing, FamilyTreeRepository trees, FamilySnapshotService snapshots) {
        this.sharing = sharing; this.trees = trees; this.snapshots = snapshots;
    }
    @PostMapping("/api/trees/{treeId}/share-link")
    public TreeShareLinkResponse createLink(@PathVariable String treeId, Authentication auth) { return sharing.createReadOnlyLink(treeId, auth.getName()); }
    @PostMapping("/api/trees/{treeId}/invitations")
    public TreeInvitationResponse invite(@PathVariable String treeId, Authentication auth, @Valid @RequestBody TreeInvitationRequest request) { return sharing.invite(treeId, auth.getName(), request); }
    @GetMapping("/api/public/trees/{token}")
    public FamilySnapshotDTO publicTree(@PathVariable String token) {
        var tree = trees.findByPublicShareToken(token).orElseThrow(() -> new ResourceNotFoundException("Shared tree", token));
        return snapshots.load(tree.getId());
    }
}
