package com.example.geneatree.repository;

import com.example.geneatree.entity.FamilyTree;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FamilyTreeRepository extends JpaRepository<FamilyTree, String> {
    List<FamilyTree> findByOwnerId(String ownerId);
    Optional<FamilyTree> findByPublicShareToken(String publicShareToken);
}
