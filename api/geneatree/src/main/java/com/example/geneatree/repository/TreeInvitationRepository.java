package com.example.geneatree.repository;

import com.example.geneatree.entity.TreeInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TreeInvitationRepository extends JpaRepository<TreeInvitation, String> {
    Optional<TreeInvitation> findByTreeIdAndEmailIgnoreCase(String treeId, String email);
    List<TreeInvitation> findByEmailIgnoreCase(String email);
    void deleteByTreeId(String treeId);
}
