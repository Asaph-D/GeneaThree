package com.example.geneatree.repository;

import com.example.geneatree.entity.Marriage;
import com.example.geneatree.entity.Person;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarriageRepository extends JpaRepository<Marriage, String> {
    java.util.List<Marriage> findAllByTreeId(String treeId);
    List<Marriage> findBySpouse1IdOrSpouse2Id(String spouse1Id, String spouse2Id);
}
