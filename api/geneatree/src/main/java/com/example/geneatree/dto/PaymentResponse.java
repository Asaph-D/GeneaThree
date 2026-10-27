package com.example.geneatree.dto;

public record PaymentResponse(String reference, String status, String planCode, long amountXaf, String message,
        String redirectUrl) {}
