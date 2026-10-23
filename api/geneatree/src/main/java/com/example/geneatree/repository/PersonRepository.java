package com.example.geneatree.repository;

import com.example.geneatree.entity.Person;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PersonRepository extends JpaRepository<Person, String> {
    java.util.List<Person> findAllByTreeId(String treeId);
}
