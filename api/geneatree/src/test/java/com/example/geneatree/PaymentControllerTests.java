package com.example.geneatree;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "G2TPAY_ENABLED=false")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PaymentControllerTests {
    @Autowired MockMvc mockMvc;

    @Test
    void callbackIsPublicAndAcknowledged() throws Exception {
        mockMvc.perform(post("/api/payments/g2tpay/callback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"Status\":\"SUCCESSFUL\",\"MessageId\":\"unknown-provider-id\",\"Amount\":\"3500\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void cardCallbackIsPublicAndIdempotentWithoutReference() throws Exception {
        mockMvc.perform(post("/api/payments/cinetpay/callback")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED))
                .andExpect(status().isOk());
    }

    @Test
    void validatesCameroonianPhoneBeforeCallingGateway() throws Exception {
        mockMvc.perform(post("/api/payments/initiate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"planCode\":\"FAMILY_MONTHLY\",\"phoneNumber\":\"123\",\"operator\":\"MTN\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void reportsDisabledGatewayWithoutCallingProvider() throws Exception {
        mockMvc.perform(post("/api/payments/initiate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"planCode\":\"FAMILY_MONTHLY\",\"phoneNumber\":\"690000000\",\"operator\":\"MTN\"}"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.title").value("Payment gateway unavailable"));
    }

    @Test
    void reportsDisabledCardGatewayWithoutCollectingCardDetails() throws Exception {
        mockMvc.perform(post("/api/payments/card/initiate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"planCode\":\"FAMILY_MONTHLY\",\"firstName\":\"Asaph\",\"lastName\":\"Kouokam\",\"email\":\"asaph@example.com\",\"phoneNumber\":\"690000000\",\"address\":\"Douala\",\"city\":\"Douala\"}"))
                .andExpect(status().isBadGateway());
    }
}
