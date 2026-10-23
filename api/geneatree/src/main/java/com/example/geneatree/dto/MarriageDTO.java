package com.example.geneatree.dto;

import java.util.List;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Data
public class MarriageDTO {
    private String id;
    private String spouse1Id;
    private String spouse2Id;
    private String marriageDate;
    private String divorceDate;
    private String location;
    private List<String> childrenIds;
    private String eventId;

    // Getters and Setters
}
