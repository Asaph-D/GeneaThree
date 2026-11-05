package com.example.geneatree.dto;

public record TreeInvitationResponse(String email, String role, String status, String invitationToken, boolean notificationSent) {}
