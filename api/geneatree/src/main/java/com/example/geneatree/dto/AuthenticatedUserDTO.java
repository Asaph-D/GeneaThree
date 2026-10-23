package com.example.geneatree.dto;

import java.util.List;

public record AuthenticatedUserDTO(String id, String email, List<TreeAccessDTO> trees) {
    public record TreeAccessDTO(String id, String name, String role) {}
}
