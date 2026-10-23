package com.example.geneatree.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record FamilySnapshotDTO(
        int version,
        @NotNull List<@Valid PersonDTO> persons,
        @NotNull List<@Valid MarriageDTO> marriages
) {
    public FamilySnapshotDTO {
        persons = persons == null ? List.of() : List.copyOf(persons);
        marriages = marriages == null ? List.of() : List.copyOf(marriages);
    }
}

