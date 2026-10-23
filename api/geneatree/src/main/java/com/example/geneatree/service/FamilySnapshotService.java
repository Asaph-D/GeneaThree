package com.example.geneatree.service;

import com.example.geneatree.converter.MarriageConverter;
import com.example.geneatree.converter.PersonConverter;
import com.example.geneatree.dto.FamilySnapshotDTO;
import com.example.geneatree.dto.MarriageDTO;
import com.example.geneatree.dto.PersonDTO;
import com.example.geneatree.entity.LifeEvent;
import com.example.geneatree.entity.Marriage;
import com.example.geneatree.entity.Person;
import com.example.geneatree.entity.FamilyTree;
import com.example.geneatree.repository.LifeEventRepository;
import com.example.geneatree.repository.MarriageRepository;
import com.example.geneatree.repository.PersonRepository;
import com.example.geneatree.repository.FamilyTreeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;

import java.util.ArrayList;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class FamilySnapshotService {
    public static final int CURRENT_VERSION = 1;

    private final PersonRepository personRepository;
    private final MarriageRepository marriageRepository;
    private final LifeEventRepository lifeEventRepository;
    private final PersonConverter personConverter;
    private final MarriageConverter marriageConverter;
    private final EntityManager entityManager;
    private final FamilyTreeRepository familyTreeRepository;

    public FamilySnapshotService(PersonRepository personRepository, MarriageRepository marriageRepository,
            LifeEventRepository lifeEventRepository, PersonConverter personConverter,
            MarriageConverter marriageConverter, EntityManager entityManager, FamilyTreeRepository familyTreeRepository) {
        this.personRepository = personRepository;
        this.marriageRepository = marriageRepository;
        this.lifeEventRepository = lifeEventRepository;
        this.personConverter = personConverter;
        this.marriageConverter = marriageConverter;
        this.entityManager = entityManager;
        this.familyTreeRepository = familyTreeRepository;
    }

    @Transactional(readOnly = true)
    public FamilySnapshotDTO load() {
        List<PersonDTO> persons = personRepository.findAll().stream().map(personConverter::convertToDTO).toList();
        List<MarriageDTO> marriages = marriageRepository.findAll().stream().map(marriageConverter::convertToDTO).toList();
        return new FamilySnapshotDTO(CURRENT_VERSION, persons, marriages);
    }

    @Transactional(readOnly = true)
    public FamilySnapshotDTO load(String treeId) {
        List<PersonDTO> persons = personRepository.findAllByTreeId(treeId).stream().map(personConverter::convertToDTO).toList();
        List<MarriageDTO> marriages = marriageRepository.findAllByTreeId(treeId).stream().map(marriageConverter::convertToDTO).toList();
        return new FamilySnapshotDTO(CURRENT_VERSION, persons, marriages);
    }

    @Transactional
    public FamilySnapshotDTO replace(FamilySnapshotDTO snapshot) {
        validate(snapshot);
        clearStoredFamily();

        Map<String, Person> peopleById = new HashMap<>();
        for (PersonDTO dto : snapshot.persons()) {
            Person person = scalarPerson(dto);
            peopleById.put(person.getId(), person);
        }
        peopleById.values().forEach(entityManager::persist);
        entityManager.flush();

        for (PersonDTO dto : snapshot.persons()) {
            Person person = peopleById.get(dto.getId());
            person.setParents(resolvePeople(dto.getParentIds(), peopleById));
            person.setSpouses(resolvePeople(dto.getSpouseIds(), peopleById));
            person.setSiblings(resolvePeople(dto.getSiblingIds(), peopleById));
        }
        entityManager.flush();

        List<Marriage> marriages = snapshot.marriages().stream().map(dto -> marriage(dto, peopleById)).toList();
        marriages.forEach(entityManager::persist);
        entityManager.flush();
        return load();
    }

    @Transactional
    public FamilySnapshotDTO replace(String treeId, FamilySnapshotDTO snapshot) {
        validate(snapshot);
        FamilyTree tree = familyTreeRepository.findById(treeId)
                .orElseThrow(() -> new ResourceNotFoundException("Family tree", treeId));
        clearStoredTree(treeId);
        Map<String, Person> peopleById = new HashMap<>();
        for (PersonDTO dto : snapshot.persons()) {
            Person person = scalarPerson(dto);
            person.setTree(tree);
            peopleById.put(person.getId(), person);
        }
        peopleById.values().forEach(entityManager::persist);
        entityManager.flush();
        for (PersonDTO dto : snapshot.persons()) {
            Person person = peopleById.get(dto.getId());
            person.setParents(resolvePeople(dto.getParentIds(), peopleById));
            person.setSpouses(resolvePeople(dto.getSpouseIds(), peopleById));
            person.setSiblings(resolvePeople(dto.getSiblingIds(), peopleById));
        }
        entityManager.flush();
        snapshot.marriages().stream().map(dto -> {
            Marriage marriage = marriage(dto, peopleById);
            marriage.setTree(tree);
            return marriage;
        }).forEach(entityManager::persist);
        entityManager.flush();
        return load(treeId);
    }

    @Transactional
    public void clear() {
        clearStoredFamily();
    }

    @Transactional
    public void clear(String treeId) {
        clearStoredTree(treeId);
    }

    private void validate(FamilySnapshotDTO snapshot) {
        if (snapshot.version() != CURRENT_VERSION) {
            throw new IllegalArgumentException("Unsupported family snapshot version: " + snapshot.version());
        }
        Set<String> personIds = new HashSet<>();
        for (PersonDTO person : snapshot.persons()) {
            if (person.getId() == null || person.getId().isBlank()) {
                throw new IllegalArgumentException("Every person must have an id");
            }
            if (!personIds.add(person.getId())) {
                throw new IllegalArgumentException("Duplicate person id: " + person.getId());
            }
        }
        Set<String> marriageIds = new HashSet<>();
        Map<String, PersonDTO> people = new HashMap<>();
        snapshot.persons().forEach(person -> people.put(person.getId(), person));
        for (PersonDTO person : snapshot.persons()) {
            validateReferences("parentIds", person.getId(), person.getParentIds(), personIds);
            validateReferences("childrenIds", person.getId(), person.getChildrenIds(), personIds);
            validateReferences("spouseIds", person.getId(), person.getSpouseIds(), personIds);
            validateReferences("siblingIds", person.getId(), person.getSiblingIds(), personIds);
            validateNoSelfReferences(person);
            validatePersonDates(person);
        }
        for (MarriageDTO marriage : snapshot.marriages()) {
            if (marriage.getId() == null || marriage.getId().isBlank()) {
                throw new IllegalArgumentException("Every marriage must have an id");
            }
            if (!marriageIds.add(marriage.getId())) {
                throw new IllegalArgumentException("Duplicate marriage id: " + marriage.getId());
            }
            validateReference("spouse1Id", marriage.getId(), marriage.getSpouse1Id(), personIds, true);
            validateReference("spouse2Id", marriage.getId(), marriage.getSpouse2Id(), personIds, true);
            validateReferences("childrenIds", marriage.getId(), marriage.getChildrenIds(), personIds);
            if (marriage.getSpouse1Id().equals(marriage.getSpouse2Id())) {
                throw new IllegalArgumentException("A marriage must link two different people: " + marriage.getId());
            }
            validateDateOrder("marriage", marriage.getId(), marriage.getMarriageDate(), marriage.getDivorceDate());
            validateMarriageRelations(marriage, people);
        }
        validateReciprocalRelations(people);
        validateNoAncestryCycles(people);
    }

    private void validateNoSelfReferences(PersonDTO person) {
        Map<String, List<String>> relations = Map.of(
                "parentIds", list(person.getParentIds()),
                "childrenIds", list(person.getChildrenIds()),
                "spouseIds", list(person.getSpouseIds()),
                "siblingIds", list(person.getSiblingIds()));
        relations.forEach((field, ids) -> {
            if (ids.contains(person.getId())) {
                throw new IllegalArgumentException(field + " of " + person.getId() + " cannot reference itself");
            }
            if (new HashSet<>(ids).size() != ids.size()) {
                throw new IllegalArgumentException(field + " of " + person.getId() + " contains duplicates");
            }
        });
    }

    private void validatePersonDates(PersonDTO person) {
        LocalDate birth = parseDate("birthDate", person.getId(), person.getBirthDate());
        LocalDate death = parseDate("deathDate", person.getId(), person.getDeathDate());
        if (birth != null && death != null && death.isBefore(birth)) {
            throw new IllegalArgumentException("deathDate must not precede birthDate for " + person.getId());
        }
        if (death != null && !person.isDeceased()) {
            throw new IllegalArgumentException("A person with a deathDate must be marked deceased: " + person.getId());
        }
    }

    private void validateDateOrder(String type, String id, String startValue, String endValue) {
        LocalDate start = parseDate(type + "Date", id, startValue);
        LocalDate end = parseDate("divorceDate", id, endValue);
        if (start != null && end != null && end.isBefore(start)) {
            throw new IllegalArgumentException("divorceDate must not precede marriageDate for " + id);
        }
    }

    private LocalDate parseDate(String field, String ownerId, String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException exception) {
            throw new IllegalArgumentException(field + " of " + ownerId + " must use YYYY-MM-DD");
        }
    }

    private void validateMarriageRelations(MarriageDTO marriage, Map<String, PersonDTO> people) {
        PersonDTO first = people.get(marriage.getSpouse1Id());
        PersonDTO second = people.get(marriage.getSpouse2Id());
        requireRelation(first.getSpouseIds(), second.getId(), "spouseIds", first.getId());
        requireRelation(second.getSpouseIds(), first.getId(), "spouseIds", second.getId());
        for (String childId : list(marriage.getChildrenIds())) {
            PersonDTO child = people.get(childId);
            requireRelation(child.getParentIds(), first.getId(), "parentIds", childId);
            requireRelation(child.getParentIds(), second.getId(), "parentIds", childId);
        }
    }

    private void validateReciprocalRelations(Map<String, PersonDTO> people) {
        for (PersonDTO person : people.values()) {
            for (String parentId : list(person.getParentIds())) {
                requireRelation(people.get(parentId).getChildrenIds(), person.getId(), "childrenIds", parentId);
            }
            for (String childId : list(person.getChildrenIds())) {
                requireRelation(people.get(childId).getParentIds(), person.getId(), "parentIds", childId);
            }
            for (String spouseId : list(person.getSpouseIds())) {
                requireRelation(people.get(spouseId).getSpouseIds(), person.getId(), "spouseIds", spouseId);
            }
            for (String siblingId : list(person.getSiblingIds())) {
                requireRelation(people.get(siblingId).getSiblingIds(), person.getId(), "siblingIds", siblingId);
            }
        }
    }

    private void validateNoAncestryCycles(Map<String, PersonDTO> people) {
        Set<String> visiting = new HashSet<>();
        Set<String> visited = new HashSet<>();
        for (String personId : people.keySet()) visitAncestors(personId, people, visiting, visited);
    }

    private void visitAncestors(String personId, Map<String, PersonDTO> people, Set<String> visiting, Set<String> visited) {
        if (visited.contains(personId)) return;
        if (!visiting.add(personId)) throw new IllegalArgumentException("Ancestry cycle detected at " + personId);
        for (String parentId : list(people.get(personId).getParentIds())) {
            visitAncestors(parentId, people, visiting, visited);
        }
        visiting.remove(personId);
        visited.add(personId);
    }

    private void requireRelation(List<String> relations, String expected, String field, String ownerId) {
        if (!list(relations).contains(expected)) {
            throw new IllegalArgumentException(field + " of " + ownerId + " must reference " + expected);
        }
    }

    private List<String> list(List<String> values) {
        return values == null ? List.of() : values;
    }

    private void validateReferences(String field, String ownerId, List<String> references, Set<String> personIds) {
        if (references == null) return;
        for (String reference : references) validateReference(field, ownerId, reference, personIds, false);
    }

    private void validateReference(String field, String ownerId, String reference, Set<String> personIds,
            boolean required) {
        if (reference == null || reference.isBlank()) {
            if (required) throw new IllegalArgumentException(field + " is required for " + ownerId);
            return;
        }
        if (!personIds.contains(reference)) {
            throw new IllegalArgumentException(field + " of " + ownerId + " references unknown person " + reference);
        }
    }

    private Person scalarPerson(PersonDTO dto) {
        Person person = new Person();
        person.setId(dto.getId());
        person.setFirstName(dto.getFirstName());
        person.setLastName(dto.getLastName());
        person.setBirthDate(dto.getBirthDate());
        person.setBirthPlace(dto.getBirthPlace());
        person.setDeathDate(dto.getDeathDate());
        person.setDeathPlace(dto.getDeathPlace());
        person.setGender(dto.getGender());
        person.setOccupation(dto.getOccupation());
        person.setDeceased(dto.isDeceased());
        person.setPhotoUrl(dto.getPhotoUrl());
        person.setBiography(dto.getBiography());
        person.setNotes(dto.getNotes());
        person.setEmail(dto.getEmail());
        person.setPhone(dto.getPhone());
        person.setParents(new ArrayList<>());
        person.setChildren(new ArrayList<>());
        person.setSpouses(new ArrayList<>());
        person.setSiblings(new ArrayList<>());
        person.setEvents(new ArrayList<>());
        return person;
    }

    private Marriage marriage(MarriageDTO dto, Map<String, Person> peopleById) {
        Marriage marriage = new Marriage();
        marriage.setId(dto.getId());
        marriage.setSpouse1(peopleById.get(dto.getSpouse1Id()));
        marriage.setSpouse2(peopleById.get(dto.getSpouse2Id()));
        marriage.setMarriageDate(dto.getMarriageDate());
        marriage.setDivorceDate(dto.getDivorceDate());
        marriage.setLocation(dto.getLocation());
        marriage.setChildren(resolvePeople(dto.getChildrenIds(), peopleById));
        return marriage;
    }

    private List<Person> resolvePeople(List<String> ids, Map<String, Person> peopleById) {
        if (ids == null) return new ArrayList<>();
        return new ArrayList<>(ids.stream().map(peopleById::get).toList());
    }

    private void clearStoredFamily() {
        marriageRepository.deleteAllInBatch();
        List<LifeEvent> events = lifeEventRepository.findAll();
        events.forEach(event -> event.setRelatedPersons(new ArrayList<>()));
        lifeEventRepository.saveAllAndFlush(events);
        List<Person> people = personRepository.findAll();
        people.forEach(person -> {
            person.setParents(new ArrayList<>());
            person.setSpouses(new ArrayList<>());
            person.setSiblings(new ArrayList<>());
            person.setEvents(new ArrayList<>());
        });
        personRepository.saveAllAndFlush(people);
        personRepository.deleteAllInBatch();
        lifeEventRepository.deleteAllInBatch();
    }

    private void clearStoredTree(String treeId) {
        List<Marriage> marriages = marriageRepository.findAllByTreeId(treeId);
        marriageRepository.deleteAll(marriages);
        marriageRepository.flush();
        List<LifeEvent> events = lifeEventRepository.findAllByTreeId(treeId);
        events.forEach(event -> event.setRelatedPersons(new ArrayList<>()));
        lifeEventRepository.saveAllAndFlush(events);
        List<Person> people = personRepository.findAllByTreeId(treeId);
        people.forEach(person -> {
            person.setParents(new ArrayList<>());
            person.setSpouses(new ArrayList<>());
            person.setSiblings(new ArrayList<>());
            person.setEvents(new ArrayList<>());
        });
        personRepository.saveAllAndFlush(people);
        personRepository.deleteAll(people);
        personRepository.flush();
        lifeEventRepository.deleteAll(events);
        lifeEventRepository.flush();
    }
}
