package com.example.geneatree.service;

import com.example.geneatree.entity.TreeAccessRole;
import com.example.geneatree.repository.AppUserRepository;
import com.example.geneatree.repository.TreeMembershipRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class TreeAccessService {
    private final AppUserRepository users;
    private final TreeMembershipRepository memberships;

    public TreeAccessService(AppUserRepository users, TreeMembershipRepository memberships) {
        this.users = users;
        this.memberships = memberships;
    }

    public TreeAccessRole requireRead(String treeId, String email) {
        return membership(treeId, email);
    }

    public TreeAccessRole requireWrite(String treeId, String email) {
        TreeAccessRole role = membership(treeId, email);
        if (role == TreeAccessRole.READER) throw new AccessDeniedException("Read-only access to tree " + treeId);
        return role;
    }

    private TreeAccessRole membership(String treeId, String email) {
        var user = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new AccessDeniedException("Unknown account"));
        return memberships.findByTreeIdAndUserId(treeId, user.getId())
                .map(membership -> membership.getRole())
                .orElseThrow(() -> new AccessDeniedException("No access to tree " + treeId));
    }
}
