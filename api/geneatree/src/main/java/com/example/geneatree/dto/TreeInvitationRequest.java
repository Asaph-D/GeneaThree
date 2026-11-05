package com.example.geneatree.dto;

import com.example.geneatree.entity.TreeAccessRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;

public record TreeInvitationRequest(@Email @NotNull String email, @NotNull TreeAccessRole role) {}
