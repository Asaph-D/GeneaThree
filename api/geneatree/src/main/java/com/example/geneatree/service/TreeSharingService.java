package com.example.geneatree.service;

import com.example.geneatree.dto.*;
import com.example.geneatree.entity.*;
import com.example.geneatree.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Service
public class TreeSharingService {
    private final FamilyTreeRepository trees;
    private final AppUserRepository users;
    private final TreeMembershipRepository memberships;
    private final TreeInvitationRepository invitations;
    private final TreeAccessService access;
    private final AdminNotificationService notifications;
    private final String publicUrl;

    public TreeSharingService(FamilyTreeRepository trees, AppUserRepository users, TreeMembershipRepository memberships,
            TreeInvitationRepository invitations, TreeAccessService access, AdminNotificationService notifications,
            @Value("${app.public-url:https://genea-three.vercel.app}") String publicUrl) {
        this.trees = trees; this.users = users; this.memberships = memberships; this.invitations = invitations; this.access = access;
        this.notifications = notifications; this.publicUrl = publicUrl.replaceAll("/+$", "");
    }

    @Transactional
    public TreeShareLinkResponse createReadOnlyLink(String treeId, String ownerEmail) {
        access.requireOwner(treeId, ownerEmail);
        FamilyTree tree = trees.findById(treeId).orElseThrow(() -> new ResourceNotFoundException("Tree", treeId));
        if (tree.getPublicShareToken() == null) tree.setPublicShareToken(UUID.randomUUID().toString().replace("-", ""));
        trees.save(tree);
        return new TreeShareLinkResponse(tree.getPublicShareToken(), "/shared/" + tree.getPublicShareToken(), "READER");
    }

    @Transactional
    public TreeInvitationResponse invite(String treeId, String ownerEmail, TreeInvitationRequest request) {
        access.requireOwner(treeId, ownerEmail);
        if (request.role() == TreeAccessRole.OWNER) throw new IllegalArgumentException("Ownership cannot be granted by invitation");
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        FamilyTree tree = trees.findById(treeId).orElseThrow(() -> new ResourceNotFoundException("Tree", treeId));
        var user = users.findByEmailIgnoreCase(email);
        if (user.isPresent()) {
            TreeMembership membership = memberships.findByTreeIdAndUserId(treeId, user.get().getId()).orElseGet(TreeMembership::new);
            membership.setTree(tree); membership.setUser(user.get()); membership.setRole(request.role()); memberships.save(membership);
            invitations.findByTreeIdAndEmailIgnoreCase(treeId, email).ifPresent(invitations::delete);
            boolean notificationSent = notifications.treeInvitation(email, ownerEmail, tree.getName(), request.role().name(), publicUrl + "/demo");
            return new TreeInvitationResponse(email, request.role().name(), "ACTIVE", null, notificationSent);
        }
        TreeInvitation invitation = invitations.findByTreeIdAndEmailIgnoreCase(treeId, email).orElseGet(TreeInvitation::new);
        invitation.setTree(tree); invitation.setEmail(email); invitation.setRole(request.role()); invitations.save(invitation);
        boolean notificationSent = notifications.treeInvitation(email, ownerEmail, tree.getName(), request.role().name(), publicUrl + "/signin?invite=" + invitation.getToken());
        return new TreeInvitationResponse(email, request.role().name(), "PENDING_REGISTRATION", invitation.getToken(), notificationSent);
    }

    @Transactional
    public void acceptPending(AppUser user) {
        invitations.findByEmailIgnoreCase(user.getEmail()).stream().filter(invite -> invite.getExpiresAt().isAfter(Instant.now())).forEach(invite -> {
            TreeMembership membership = memberships.findByTreeIdAndUserId(invite.getTree().getId(), user.getId()).orElseGet(TreeMembership::new);
            membership.setTree(invite.getTree()); membership.setUser(user); membership.setRole(invite.getRole()); memberships.save(membership);
            invitations.delete(invite);
        });
    }
}
