package com.example.geneatree.dto;

import java.time.Instant;
import java.util.List;

public record AccountExportDTO(
        String email,
        Instant accountCreatedAt,
        Instant privacyConsentAt,
        Instant exportedAt,
        List<TreeExportDTO> trees
) {
    public record TreeExportDTO(String id, String name, String role, FamilySnapshotDTO family) {}
}
