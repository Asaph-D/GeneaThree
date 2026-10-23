package com.example.geneatree;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.geneatree.entity.TreeAccessRole;
import com.example.geneatree.entity.TreeMembership;
import com.example.geneatree.repository.AppUserRepository;
import com.example.geneatree.repository.FamilyTreeRepository;
import com.example.geneatree.repository.LifeEventRepository;
import com.example.geneatree.repository.MarriageRepository;
import com.example.geneatree.repository.PersonRepository;
import com.example.geneatree.repository.TreeMembershipRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthenticationTests {
    @Autowired MockMvc mockMvc;
    @Autowired TreeMembershipRepository membershipRepository;
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
                    "parentIds": [],
                    "childrenIds": [],
                    "spouseIds": [],
                    "siblingIds": [],
                    "events": []
                  }],
                  "marriages": []
                }
                """;
    }

    private record Registration(String email, String password, String treeName, boolean privacyConsent) {}
}
