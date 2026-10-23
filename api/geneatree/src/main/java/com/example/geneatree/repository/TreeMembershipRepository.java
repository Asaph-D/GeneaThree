package com.example.geneatree.repository;

import com.example.geneatree.entity.TreeMembership;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TreeMembershipRepository extends JpaRepository<TreeMembership, String> {
    Optional<TreeMembership> findByTreeIdAndUserId(String treeId, String userId);
    List<TreeMembership> findByUserId(String userId);
    List<TreeMembership> findByTreeId(String treeId);
}
