package com.example.geneatree;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FamilySnapshotControllerTests {
    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void clearFamily() throws Exception {
        mockMvc.perform(delete("/api/family")).andExpect(status().isNoContent());
    }

    @Test
    void replacesAndLoadsACompleteFamilySnapshot() throws Exception {
        mockMvc.perform(put("/api/family")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validSnapshot()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.persons", hasSize(3)))
                .andExpect(jsonPath("$.marriages", hasSize(1)))
                .andExpect(jsonPath("$.marriages[0].childrenIds[0]").value("child"));

        mockMvc.perform(get("/api/family"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.persons", hasSize(3)))
                .andExpect(jsonPath("$.marriages[0].spouse1Id").value("parent-a"))
                .andExpect(jsonPath("$.marriages[0].spouse2Id").value("parent-b"));
    }

    @Test
    void rejectsUnknownReferencesWithoutReplacingStoredFamily() throws Exception {
        mockMvc.perform(put("/api/family")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validSnapshot()))
                .andExpect(status().isOk());

        String invalidSnapshot = validSnapshot().replace("\"child\"]", "\"missing\"]");
        mockMvc.perform(put("/api/family")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidSnapshot))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Invalid family snapshot"));

        mockMvc.perform(get("/api/family"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.persons", hasSize(3)))
                .andExpect(jsonPath("$.marriages", hasSize(1)));
    }

    @Test
    void rejectsInconsistentDates() throws Exception {
        String invalidSnapshot = validSnapshot().replace(
                "\"birthDate\": \"1970-01-01\", \"birthPlace\": \"Douala\", \"gender\": \"male\"",
                "\"birthDate\": \"1970-01-01\", \"deathDate\": \"1960-01-01\", \"birthPlace\": \"Douala\", \"gender\": \"male\", \"deceased\": true")
                .replace("\"deceased\": true,\n                      \"deceased\": false", "\"deceased\": true");

        mockMvc.perform(put("/api/family").contentType(MediaType.APPLICATION_JSON).content(invalidSnapshot))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("deathDate must not precede birthDate for parent-a"));
    }

    @Test
    void rejectsNonReciprocalRelations() throws Exception {
        String invalidSnapshot = validSnapshot().replace(
                "\"spouseIds\": [\"parent-a\"]", "\"spouseIds\": []");

        mockMvc.perform(put("/api/family").contentType(MediaType.APPLICATION_JSON).content(invalidSnapshot))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("spouseIds of parent-b must reference parent-a"));
    }

    @Test
    void rejectsAncestryCycles() throws Exception {
        String invalidSnapshot = validSnapshot()
                .replace("\"deceased\": false, \"parentIds\": [], \"childrenIds\": [\"child\"]",
                        "\"deceased\": false, \"parentIds\": [\"child\"], \"childrenIds\": [\"child\"]")
                .replace("\"parentIds\": [\"parent-a\", \"parent-b\"], \"childrenIds\": []",
                        "\"parentIds\": [\"parent-a\", \"parent-b\"], \"childrenIds\": [\"parent-a\", \"parent-b\"]");

        mockMvc.perform(put("/api/family").contentType(MediaType.APPLICATION_JSON).content(invalidSnapshot))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value(containsString("Ancestry cycle detected at")));
    }

    @Test
    void legacyCrudReturnsProblemDetailsForMissingResources() throws Exception {
        mockMvc.perform(get("/api/people/missing"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Resource not found"))
                .andExpect(jsonPath("$.detail").value("Person not found: missing"));

        mockMvc.perform(get("/api/marriages/missing"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Resource not found"));

        mockMvc.perform(get("/api/life-events/missing"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Resource not found"));
    }

    private String validSnapshot() {
        return """
                {
                  "version": 1,
                  "persons": [
                    {
                      "id": "parent-a", "firstName": "A", "lastName": "Family",
                      "birthDate": "1970-01-01", "birthPlace": "Douala", "gender": "male",
                      "deceased": false, "parentIds": [], "childrenIds": ["child"],
                      "spouseIds": ["parent-b"], "siblingIds": [], "eventIds": []
                    },
                    {
                      "id": "parent-b", "firstName": "B", "lastName": "Family",
                      "birthDate": "1972-01-01", "birthPlace": "Douala", "gender": "female",
                      "deceased": false, "parentIds": [], "childrenIds": ["child"],
                      "spouseIds": ["parent-a"], "siblingIds": [], "eventIds": []
                    },
                    {
                      "id": "child", "firstName": "C", "lastName": "Family",
                      "birthDate": "2000-01-01", "birthPlace": "Douala", "gender": "unknown",
                      "deceased": false, "parentIds": ["parent-a", "parent-b"], "childrenIds": [],
                      "spouseIds": [], "siblingIds": [], "eventIds": []
                    }
                  ],
                  "marriages": [
                    {
                      "id": "union-1", "spouse1Id": "parent-a", "spouse2Id": "parent-b",
                      "location": "Douala", "childrenIds": ["child"]
                    }
                  ]
                }
                """;
    }
}
