package com.example.geneatree.repository;

import com.example.geneatree.entity.FamilyTree;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FamilyTreeRepository extends JpaRepository<FamilyTree, String> {
    List<FamilyTree> findByOwnerId(String ownerId);
}
