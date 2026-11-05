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

    public boolean treeInvitation(String recipient, String inviter, String treeName, String role, String actionUrl) {
        String access = "COLLABORATOR".equals(role) ? "consulter et modifier" : "consulter en lecture seule";
        String subject = "Vous êtes invité sur l'arbre « " + treeName + " »";
        String text = inviter + " vous invite à " + access + " l'arbre « " + treeName + " » sur GeneaTreePro.\n\nOuvrir l'invitation : " + actionUrl;
        String html = """
                <div style="background:#09090b;padding:32px;font-family:Arial,sans-serif;color:#f4f4f5">
                  <div style="max-width:560px;margin:auto;border:1px solid #27272a;border-radius:24px;overflow:hidden;background:#111114">
                    <div style="height:4px;background:linear-gradient(90deg,#0ea5e9,#6366f1,#8b5cf6)"></div>
                    <div style="padding:32px">
                      <p style="margin:0 0 10px;color:#38bdf8;font-size:11px;letter-spacing:2px;text-transform:uppercase">Invitation GeneaTreePro</p>
                      <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:28px;color:#fff">Une histoire familiale vous attend</h1>
                      <p style="line-height:1.7;color:#d4d4d8"><strong style="color:#fff">%s</strong> vous invite à %s l'arbre <strong style="color:#fff">« %s »</strong>.</p>
                      <a href="%s" style="display:inline-block;margin-top:18px;padding:13px 22px;border-radius:12px;background:linear-gradient(90deg,#0ea5e9,#6366f1);color:white;text-decoration:none;font-weight:700">Ouvrir l'arbre</a>
                      <p style="margin-top:26px;color:#71717a;font-size:12px;line-height:1.6">Cet accès est personnel. Si vous n'attendiez pas cette invitation, vous pouvez ignorer ce message.</p>
                    </div>
                  </div>
                </div>
                """.formatted(escape(inviter), escape(access), escape(treeName), escape(actionUrl));
        return sendTo(recipient, subject, text, html);
    }

    private void send(String subject, String text) {
        if (apiKey.isBlank() || adminEmail.isBlank()) return;
        sendTo(adminEmail, subject, text, null);
    }

    private boolean sendTo(String recipient, String subject, String text, String html) {
        if (apiKey.isBlank() || recipient == null || recipient.isBlank()) return false;
        try {
            Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("from", fromEmail);
            payload.put("to", new String[] { recipient });
            payload.put("subject", subject);
            payload.put("text", text);
            if (html != null) payload.put("html", html);
            String body = objectMapper.writeValueAsString(payload);
            HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + apiKey).header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body)).build();
            HttpResponse<Void> response = client.send(request, HttpResponse.BodyHandlers.discarding());
            return response.statusCode() >= 200 && response.statusCode() < 300;
        } catch (Exception ignored) {
            // La notification ne doit jamais bloquer l’inscription ou la recherche.
            return false;
        }
    }

    private String escape(String value) {
        return value == null ? "" : value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
