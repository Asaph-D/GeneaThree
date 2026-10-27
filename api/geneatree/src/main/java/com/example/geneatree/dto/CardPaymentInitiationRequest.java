package com.example.geneatree.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CardPaymentInitiationRequest(
        @NotBlank String planCode,
        @NotBlank String firstName,
        @NotBlank String lastName,
        @Email @NotBlank String email,
        @NotBlank String phoneNumber,
        @NotBlank String address,
        @NotBlank String city) {}
