package com.example.geneatree.config;

import java.util.Arrays;
import java.util.Collections;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import com.example.geneatree.entity.LifeEvent;
import com.example.geneatree.entity.Marriage;
import com.example.geneatree.entity.Person;
import com.example.geneatree.repository.LifeEventRepository;
import com.example.geneatree.repository.MarriageRepository;
import com.example.geneatree.repository.PersonRepository;

@Configuration
@Profile("demo")
public class DBInitializer {
    @Bean
    CommandLineRunner initDatabase(PersonRepository personRepo, MarriageRepository marriageRepo, LifeEventRepository eventRepo) {
        return args -> {
            // Generation 1
            Person g1a = new Person();
            g1a.setFirstName("William");
            g1a.setLastName("Smith");
            g1a.setGender("male");
            g1a.setBirthDate("1920-01-01");
            g1a.setBirthPlace("London");
            personRepo.save(g1a);

            Person g1b = new Person();
            g1b.setFirstName("Elizabeth");
            g1b.setLastName("Smith");
            g1b.setGender("female");
            g1b.setBirthDate("1922-03-15");
            g1b.setBirthPlace("London");
            personRepo.save(g1b);

            // Generation 2
            Person g2a = new Person();
            g2a.setFirstName("Robert");
            g2a.setLastName("Smith");
            g2a.setGender("male");
            g2a.setBirthDate("1945-06-10");
            g2a.setBirthPlace("London");
            g2a.setParents(Arrays.asList(g1a, g1b));
            personRepo.save(g2a);

            Person g2b = new Person();
            g2b.setFirstName("Margaret");
            g2b.setLastName("Smith");
            g2b.setGender("female");
            g2b.setBirthDate("1947-09-20");
            g2b.setBirthPlace("London");
            g2b.setParents(Arrays.asList(g1a, g1b));
            personRepo.save(g2b);

            // Ajout famille étendue (oncles/tantes)
            Person g2c = new Person();
            g2c.setFirstName("James");
            g2c.setLastName("Smith");
            g2c.setGender("male");
            g2c.setBirthDate("1950-04-12");
            g2c.setBirthPlace("London");
            g2c.setOccupation("Teacher");
            g2c.setDeceased(false);
            g2c.setPhotoUrl("http://example.com/james.jpg");
            g2c.setBiography("James is William's son, uncle of John.");
            g2c.setNotes("Loves chess.");
            g2c.setEmail("james.smith@example.com");
            g2c.setPhone("111222333");
            g2c.setParents(Arrays.asList(g1a, g1b));
            personRepo.save(g2c);

            Person g2d = new Person();
            g2d.setFirstName("Susan");
            g2d.setLastName("Smith");
            g2d.setGender("female");
            g2d.setBirthDate("1952-08-30");
            g2d.setBirthPlace("London");
            g2d.setOccupation("Nurse");
            g2d.setDeceased(false);
            g2d.setPhotoUrl("http://example.com/susan.jpg");
            g2d.setBiography("Susan is William's daughter, aunt of John.");
            g2d.setNotes("Enjoys gardening.");
            g2d.setEmail("susan.smith@example.com");
            g2d.setPhone("444555666");
            g2d.setParents(Arrays.asList(g1a, g1b));
            personRepo.save(g2d);

            // Siblings
            g2a.setSiblings(Arrays.asList(g2b, g2c, g2d));
            g2b.setSiblings(Arrays.asList(g2a, g2c, g2d));
            g2c.setSiblings(Arrays.asList(g2a, g2b, g2d));
            g2d.setSiblings(Arrays.asList(g2a, g2b, g2c));
            personRepo.save(g2a);
            personRepo.save(g2b);
            personRepo.save(g2c);
            personRepo.save(g2d);

            // Generation 3
            Person g3a = new Person();
            g3a.setFirstName("John");
            g3a.setLastName("Smith");
            g3a.setGender("male");
            g3a.setBirthDate("1970-02-05");
            g3a.setBirthPlace("London");
            g3a.setParents(Collections.singletonList(g2a));
            personRepo.save(g3a);

            Person g3b = new Person();
            g3b.setFirstName("Linda");
            g3b.setLastName("Smith");
            g3b.setGender("female");
            g3b.setBirthDate("1972-11-12");
            g3b.setBirthPlace("London");
            g3b.setParents(Collections.singletonList(g2b));
            personRepo.save(g3b);

            // Generation 4
            Person g4a = new Person();
            g4a.setFirstName("Michael");
            g4a.setLastName("Smith");
            g4a.setGender("male");
            g4a.setBirthDate("1995-07-23");
            g4a.setBirthPlace("London");
            g4a.setParents(Arrays.asList(g3a, g3b));
            personRepo.save(g4a);

            // Marriages
            Marriage m1 = new Marriage();
            m1.setSpouse1(g1a);
            m1.setSpouse2(g1b);
            m1.setMarriageDate("1940-05-01");
            m1.setLocation("London");
            marriageRepo.save(m1);

            Marriage m2 = new Marriage();
            m2.setSpouse1(g2a);
            m2.setSpouse2(g2b);
            m2.setMarriageDate("1968-08-15");
            m2.setLocation("London");
            marriageRepo.save(m2);

            Marriage m3 = new Marriage();
            m3.setSpouse1(g3a);
            m3.setSpouse2(g3b);
            m3.setMarriageDate("1990-04-10");
            m3.setLocation("London");
            marriageRepo.save(m3);

            // Life Events
            LifeEvent e1 = new LifeEvent();
            e1.setType("birth");
            e1.setDate("1920-01-01");
            e1.setLocation("London");
            e1.setDescription("Birth of William Smith");
            eventRepo.save(e1);

            LifeEvent e2 = new LifeEvent();
            e2.setType("birth");
            e2.setDate("1995-07-23");
            e2.setLocation("London");
            e2.setDescription("Birth of Michael Smith");
            eventRepo.save(e2);

            // Ajout d'événements supplémentaires
            LifeEvent e3 = new LifeEvent();
            e3.setType("marriage");
            e3.setDate("1968-08-15");
            e3.setLocation("London");
            e3.setDescription("Marriage of Robert and Margaret Smith");
            eventRepo.save(e3);

            LifeEvent e4 = new LifeEvent();
            e4.setType("death");
            e4.setDate("1990-01-01");
            e4.setLocation("London");
            e4.setDescription("Death of William Smith");
            eventRepo.save(e4);

            LifeEvent e5 = new LifeEvent();
            e5.setType("graduation");
            e5.setDate("2015-06-30");
            e5.setLocation("London");
            e5.setDescription("Michael Smith graduated from university");
            eventRepo.save(e5);

            // Remplir tous les attributs pour les autres personnes
            g1a.setOccupation("Farmer");
            g1a.setDeceased(true);
            g1a.setDeathDate("1990-01-01");
            g1a.setDeathPlace("London");
            g1a.setPhotoUrl("http://example.com/william.jpg");
            g1a.setBiography("William Smith, patriarch.");
            g1a.setNotes("Founded the family business.");
            g1a.setEmail("william.smith@example.com");
            g1a.setPhone("123456789");
            personRepo.save(g1a);

            g1b.setOccupation("Homemaker");
            g1b.setDeceased(true);
            g1b.setDeathDate("1995-03-15");
            g1b.setDeathPlace("London");
            g1b.setPhotoUrl("http://example.com/elizabeth.jpg");
            g1b.setBiography("Elizabeth Smith, matriarch.");
            g1b.setNotes("Loved baking.");
            g1b.setEmail("elizabeth.smith@example.com");
            g1b.setPhone("987654321");
            personRepo.save(g1b);

            g2a.setOccupation("Engineer");
            g2a.setDeceased(false);
            g2a.setPhotoUrl("http://example.com/robert.jpg");
            g2a.setBiography("Robert Smith, son of William.");
            g2a.setNotes("Enjoys hiking.");
            g2a.setEmail("robert.smith@example.com");
            g2a.setPhone("222333444");
            personRepo.save(g2a);

            g2b.setOccupation("Artist");
            g2b.setDeceased(false);
            g2b.setPhotoUrl("http://example.com/margaret.jpg");
            g2b.setBiography("Margaret Smith, daughter of William.");
            g2b.setNotes("Paints landscapes.");
            g2b.setEmail("margaret.smith@example.com");
            g2b.setPhone("333444555");
            personRepo.save(g2b);

            g3a.setOccupation("Doctor");
            g3a.setDeceased(false);
            g3a.setPhotoUrl("http://example.com/john.jpg");
            g3a.setBiography("John Smith, grandson of William.");
            g3a.setNotes("Plays piano.");
            g3a.setEmail("john.smith@example.com");
            g3a.setPhone("555666777");
            personRepo.save(g3a);

            g3b.setOccupation("Lawyer");
            g3b.setDeceased(false);
            g3b.setPhotoUrl("http://example.com/linda.jpg");
            g3b.setBiography("Linda Smith, granddaughter of William.");
            g3b.setNotes("Runs marathons.");
            g3b.setEmail("linda.smith@example.com");
            g3b.setPhone("666777888");
            personRepo.save(g3b);

            g4a.setOccupation("Student");
            g4a.setDeceased(false);
            g4a.setPhotoUrl("http://example.com/michael.jpg");
            g4a.setBiography("Michael Smith, great-grandson of William.");
            g4a.setNotes("Loves coding.");
            g4a.setEmail("michael.smith@example.com");
            g4a.setPhone("777888999");
            personRepo.save(g4a);
        };
    }
}
