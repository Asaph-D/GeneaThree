package com.example.geneatree.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PaymentInitiationRequest(
        @NotBlank String planCode,
        @NotBlank @Pattern(regexp = "^(?:\\+?237)?6[0-9]{8}$", message = "Numéro Mobile Money camerounais invalide") String phoneNumber,
        @NotBlank @Pattern(regexp = "^(MTN|ORANGE)$", message = "Opérateur invalide") String operator,
        @Email String email) {}
