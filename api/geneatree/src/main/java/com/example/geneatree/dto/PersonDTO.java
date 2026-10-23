package com.example.geneatree.dto;

import java.util.List;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Data
public class PersonDTO {
    private String id;
    private String firstName;
    private String lastName;
    private String birthDate;
    private String birthPlace;
    private String deathDate;
    private String deathPlace;
    private String gender;
    private String occupation;
    private boolean deceased;
    private String photoUrl;
    private String biography;
    private String notes;
    private String email;
    private String phone;
    private List<String> parentIds;
    private List<String> childrenIds;
    private List<String> spouseIds;
    private List<String> siblingIds;
    private List<String> eventIds;

    // Getters and Setters
}
