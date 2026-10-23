package com.example.geneatree.repository;

import com.example.geneatree.entity.LifeEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LifeEventRepository extends JpaRepository<LifeEvent, String> {
    java.util.List<LifeEvent> findAllByTreeId(String treeId);
    List<LifeEvent> findByRelatedPersonsId(String personId);
}
