package com.example.geneatree;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.example.geneatree.entity.TreeAccessRole;
import com.example.geneatree.entity.TreeMembership;
import com.example.geneatree.repository.AppUserRepository;
import com.example.geneatree.repository.FamilyTreeRepository;
import com.example.geneatree.repository.LifeEventRepository;
import com.example.geneatree.repository.MarriageRepository;
import com.example.geneatree.repository.PersonRepository;
import com.example.geneatree.repository.TreeMembershipRepository;
import com.example.geneatree.repository.TreeInvitationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Base64;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthenticationTests {
    @Autowired MockMvc mockMvc;
    @Autowired TreeMembershipRepository membershipRepository;
    @Autowired TreeInvitationRepository invitationRepository;
    @Autowired FamilyTreeRepository treeRepository;
    @Autowired AppUserRepository userRepository;
    @Autowired MarriageRepository marriageRepository;
    @Autowired LifeEventRepository lifeEventRepository;
    @Autowired PersonRepository personRepository;
    @Autowired ObjectMapper objectMapper;

    @BeforeEach
    void clearAccounts() {
        marriageRepository.deleteAll();
        lifeEventRepository.deleteAll();
        personRepository.deleteAll();
        invitationRepository.deleteAll();
        membershipRepository.deleteAll();
        treeRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void registersOwnerAndAuthenticatesWithBasicCredentials() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"owner@example.com","password":"strong-passphrase","treeName":"Famille Kouokam","privacyConsent":true}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("owner@example.com"))
                .andExpect(jsonPath("$.trees[0].role").value("OWNER"));

        String credentials = Base64.getEncoder().encodeToString(
                "owner@example.com:strong-passphrase".getBytes(StandardCharsets.UTF_8));
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Basic " + credentials))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trees[0].name").value("Famille Kouokam"));
    }

    @Test
    void rejectsAnonymousProfileAccess() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void exposesHealthWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void acceptsVercelCorsPreflightForAuthenticatedRoutes() throws Exception {
        mockMvc.perform(options("/api/auth/sync")
                        .header("Origin", "https://genea-three.vercel.app")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "authorization,content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://genea-three.vercel.app"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    void synchronizesSupabaseAccountWithBearerToken() throws Exception {
        String token = supabaseToken("oauth@example.com");

        String accountResponse = mockMvc.perform(post("/api/auth/sync")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("oauth@example.com"))
                .andExpect(jsonPath("$.trees[0].role").value("OWNER"))
                .andReturn().getResponse().getContentAsString();
        String treeId = objectMapper.readTree(accountResponse).path("trees").path(0).path("id").asText();

        mockMvc.perform(put("/api/trees/{treeId}/family", treeId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(singlePersonSnapshot()))
                .andExpect(status().isOk());

        String secondTreeId = register("second@example.com", "second-passphrase", "Deuxième arbre");
        mockMvc.perform(put("/api/trees/{treeId}/family", secondTreeId)
                        .header("Authorization", basic("second@example.com", "second-passphrase"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(singlePersonSnapshot()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.persons[0].id").value("owner-person"));

        String linkResponse = mockMvc.perform(post("/api/trees/{treeId}/share-link", treeId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String publicToken = objectMapper.readTree(linkResponse).path("token").asText();

        mockMvc.perform(get("/api/public/trees/{token}", publicToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.persons[0].id").value("owner-person"));
    }

    @Test
    void scopesFamilyDataToAuthorizedTreeMembers() throws Exception {
        String ownerTreeId = register("owner@example.com", "strong-passphrase", "Famille Owner");
        register("outsider@example.com", "another-passphrase", "Famille Outsider");

        mockMvc.perform(put("/api/trees/{treeId}/family", ownerTreeId)
                        .header("Authorization", basic("owner@example.com", "strong-passphrase"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(singlePersonSnapshot()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.persons[0].id").value("owner-person"));

        mockMvc.perform(get("/api/trees/{treeId}/family", ownerTreeId)
                        .header("Authorization", basic("outsider@example.com", "another-passphrase")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.title").value("Tree access denied"));

        mockMvc.perform(get("/api/trees/{treeId}/family", ownerTreeId))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void allowsReaderToLoadButNotReplaceTree() throws Exception {
        String treeId = register("owner@example.com", "strong-passphrase", "Famille Owner");
        register("reader@example.com", "reader-passphrase", "Famille Reader");
        TreeMembership membership = new TreeMembership();
        membership.setTree(treeRepository.findById(treeId).orElseThrow());
        membership.setUser(userRepository.findByEmailIgnoreCase("reader@example.com").orElseThrow());
        membership.setRole(TreeAccessRole.READER);
        membershipRepository.save(membership);

        mockMvc.perform(get("/api/trees/{treeId}/family", treeId)
                        .header("Authorization", basic("reader@example.com", "reader-passphrase")))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/trees/{treeId}/family", treeId)
                        .header("Authorization", basic("reader@example.com", "reader-passphrase"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(singlePersonSnapshot()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.title").value("Tree access denied"));
    }

    @Test
    void createsPublicReadOnlyLinkAndInvitesCollaborator() throws Exception {
        String treeId = register("owner@example.com", "strong-passphrase", "Famille Owner");
        register("collaborator@example.com", "collaborator-passphrase", "Famille Collaborator");

        String linkResponse = mockMvc.perform(post("/api/trees/{treeId}/share-link", treeId)
                        .header("Authorization", basic("owner@example.com", "strong-passphrase")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.access").value("READER"))
                .andReturn().getResponse().getContentAsString();
        String token = objectMapper.readTree(linkResponse).path("token").asText();
        mockMvc.perform(get("/api/public/trees/{token}", token))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/trees/{treeId}/invitations", treeId)
                        .header("Authorization", basic("owner@example.com", "strong-passphrase"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"collaborator@example.com","role":"COLLABORATOR"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
        mockMvc.perform(put("/api/trees/{treeId}/family", treeId)
                        .header("Authorization", basic("collaborator@example.com", "collaborator-passphrase"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(singlePersonSnapshot()))
                .andExpect(status().isOk());
    }

    @Test
    void keepsUnknownInvitePendingUntilRegistration() throws Exception {
        String treeId = register("owner@example.com", "strong-passphrase", "Famille Owner");
        mockMvc.perform(post("/api/trees/{treeId}/invitations", treeId)
                        .header("Authorization", basic("owner@example.com", "strong-passphrase"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"future@example.com","role":"READER"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING_REGISTRATION"));
        register("future@example.com", "future-passphrase", "Mon arbre");
        mockMvc.perform(get("/api/trees/{treeId}/family", treeId)
                        .header("Authorization", basic("future@example.com", "future-passphrase")))
                .andExpect(status().isOk());
        mockMvc.perform(put("/api/trees/{treeId}/family", treeId)
                        .header("Authorization", basic("future@example.com", "future-passphrase"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(singlePersonSnapshot()))
                .andExpect(status().isForbidden());
    }

    @Test
    void exportsThenDeletesPersonalData() throws Exception {
        register("owner@example.com", "strong-passphrase", "Famille Owner");

        mockMvc.perform(get("/api/auth/export")
                        .header("Authorization", basic("owner@example.com", "strong-passphrase")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("owner@example.com"))
                .andExpect(jsonPath("$.privacyConsentAt").isNotEmpty())
                .andExpect(jsonPath("$.trees[0].role").value("OWNER"));

        mockMvc.perform(delete("/api/auth/me")
                        .header("Authorization", basic("owner@example.com", "strong-passphrase")))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", basic("owner@example.com", "strong-passphrase")))
                .andExpect(status().isUnauthorized());
    }

    private String register(String email, String password, String treeName) throws Exception {
        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new Registration(email, password, treeName, true))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode body = objectMapper.readTree(response);
        return body.path("trees").path(0).path("id").asText();
    }

    private String basic(String email, String password) {
        String credentials = Base64.getEncoder().encodeToString((email + ":" + password).getBytes(StandardCharsets.UTF_8));
        return "Basic " + credentials;
    }

    private String supabaseToken(String email) throws Exception {
        SignedJWT jwt = new SignedJWT(
                new JWSHeader(JWSAlgorithm.HS256),
                new JWTClaimsSet.Builder()
                        .issuer("https://jyswncifgsyilrrvcurn.supabase.co/auth/v1")
                        .subject("test-supabase-user")
                        .audience(List.of("authenticated"))
                        .claim("email", email)
                        .issueTime(Date.from(Instant.now()))
                        .expirationTime(Date.from(Instant.now().plusSeconds(300)))
                        .build());
        jwt.sign(new MACSigner("geneatree-test-secret-at-least-32-bytes".getBytes(StandardCharsets.UTF_8)));
        return jwt.serialize();
    }

    private String singlePersonSnapshot() {
        return """
                {
                  "version": 1,
                  "persons": [{
                    "id": "owner-person",
                    "firstName": "Amina",
                    "lastName": "Owner",
                    "gender": "female",
                    "deceased": false,
                    "photoUrl": "%s",
                    "parentIds": [],
                    "childrenIds": [],
                    "spouseIds": [],
                    "siblingIds": [],
                    "events": []
                  }],
                  "marriages": []
                }
                """.formatted("data:image/png;base64," + "A".repeat(600));
    }

    private record Registration(String email, String password, String treeName, boolean privacyConsent) {}
}
