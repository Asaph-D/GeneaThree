package com.example.geneatree.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 10, max = 72) String password,
        @NotBlank @Size(max = 120) String treeName,
        @AssertTrue(message = "Privacy consent is required") boolean privacyConsent
) {}
