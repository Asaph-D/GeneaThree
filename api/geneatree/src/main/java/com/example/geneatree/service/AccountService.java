package com.example.geneatree.service;

import com.example.geneatree.dto.AuthenticatedUserDTO;
import com.example.geneatree.dto.AccountExportDTO;
import com.example.geneatree.dto.RegisterRequest;
import com.example.geneatree.entity.AppUser;
import com.example.geneatree.entity.FamilyTree;
import com.example.geneatree.entity.TreeAccessRole;
import com.example.geneatree.entity.TreeMembership;
import com.example.geneatree.repository.AppUserRepository;
import com.example.geneatree.repository.FamilyTreeRepository;
import com.example.geneatree.repository.TreeMembershipRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.time.Instant;

@Service
public class AccountService {
    private final AppUserRepository userRepository;
    private final FamilyTreeRepository treeRepository;
    private final TreeMembershipRepository membershipRepository;
    private final PasswordEncoder passwordEncoder;
    private final FamilySnapshotService familySnapshotService;

    public AccountService(AppUserRepository userRepository, FamilyTreeRepository treeRepository,
            TreeMembershipRepository membershipRepository, PasswordEncoder passwordEncoder,
            FamilySnapshotService familySnapshotService) {
        this.userRepository = userRepository;
        this.treeRepository = treeRepository;
        this.membershipRepository = membershipRepository;
        this.passwordEncoder = passwordEncoder;
        this.familySnapshotService = familySnapshotService;
    }

    @Transactional
    public AuthenticatedUserDTO register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("An account already exists for this email");
        }
        AppUser user = new AppUser();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        userRepository.save(user);

        FamilyTree tree = new FamilyTree();
        tree.setName(request.treeName().trim());
        tree.setOwner(user);
        treeRepository.save(tree);

        TreeMembership membership = new TreeMembership();
        membership.setTree(tree);
        membership.setUser(user);
        membership.setRole(TreeAccessRole.OWNER);
        membershipRepository.save(membership);
        return describe(user);
    }

    @Transactional(readOnly = true)
    public AuthenticatedUserDTO describeByEmail(String email) {
        AppUser user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));
        return describe(user);
    }

    @Transactional(readOnly = true)
    public AccountExportDTO exportByEmail(String email) {
        AppUser user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));
        var trees = membershipRepository.findByUserId(user.getId()).stream()
                .map(membership -> new AccountExportDTO.TreeExportDTO(
                        membership.getTree().getId(), membership.getTree().getName(), membership.getRole().name(),
                        familySnapshotService.load(membership.getTree().getId())))
                .toList();
        return new AccountExportDTO(user.getEmail(), user.getCreatedAt(), user.getPrivacyConsentAt(), Instant.now(), trees);
    }

    @Transactional
    public void deleteByEmail(String email) {
        AppUser user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));
        for (FamilyTree tree : treeRepository.findByOwnerId(user.getId())) {
            familySnapshotService.clear(tree.getId());
            membershipRepository.deleteAll(membershipRepository.findByTreeId(tree.getId()));
            treeRepository.delete(tree);
        }
        membershipRepository.deleteAll(membershipRepository.findByUserId(user.getId()));
        userRepository.delete(user);
    }

    private AuthenticatedUserDTO describe(AppUser user) {
        var trees = membershipRepository.findByUserId(user.getId()).stream()
                .map(membership -> new AuthenticatedUserDTO.TreeAccessDTO(
                        membership.getTree().getId(), membership.getTree().getName(), membership.getRole().name()))
                .toList();
        return new AuthenticatedUserDTO(user.getId(), user.getEmail(), trees);
    }
}
