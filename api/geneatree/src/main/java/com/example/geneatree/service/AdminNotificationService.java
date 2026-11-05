package com.example.geneatree.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

@Service
public class AdminNotificationService {
    private final ObjectMapper objectMapper;
    private final HttpClient client = HttpClient.newHttpClient();
    private final String apiKey;
    private final String adminEmail;
    private final String fromEmail;

    public AdminNotificationService(ObjectMapper objectMapper,
            @Value("${app.notifications.resend-api-key:}") String apiKey,
            @Value("${app.notifications.admin-email:}") String adminEmail,
            @Value("${app.notifications.from-email:GeneaTreePro <onboarding@resend.dev>}") String fromEmail) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.adminEmail = adminEmail;
        this.fromEmail = fromEmail;
    }

    public void newAccount(String email, String provider) {
        send("Nouveau compte GeneaTreePro", "Un nouveau compte a été créé.\n\nAdresse : " + email + "\nOrigine : " + provider);
    }

    public void emptyDiscoverySearch(String query, String category) {
        send("Recherche Découvrir sans résultat", "Recherche : " + query + "\nCatégorie : " + (category == null ? "Toutes" : category));
    }

    private void send(String subject, String text) {
        if (apiKey.isBlank() || adminEmail.isBlank()) return;
        try {
            String body = objectMapper.writeValueAsString(Map.of("from", fromEmail, "to", new String[] { adminEmail }, "subject", subject, "text", text));
            HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + apiKey).header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body)).build();
            client.sendAsync(request, HttpResponse.BodyHandlers.discarding());
        } catch (Exception ignored) {
            // La notification ne doit jamais bloquer l’inscription ou la recherche.
        }
    }
}
