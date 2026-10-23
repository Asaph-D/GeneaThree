package com.example.geneatree.dto;

import java.util.List;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Data
public class LifeEventDTO {
    private String id;
    private String type;
    private String date;
    private String location;
    private String description;
    private List<String> relatedPersonIds;

    // Getters and Setters
}
