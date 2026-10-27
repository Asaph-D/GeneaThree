package com.example.geneatree.service;

import com.example.geneatree.dto.CardPaymentInitiationRequest;
import com.example.geneatree.dto.PaymentResponse;
import com.example.geneatree.entity.PaymentTransaction;
import com.example.geneatree.repository.PaymentTransactionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Service
public class CinetPayService {
    private final PaymentTransactionRepository payments;
    private final RestClient client;
    private final boolean enabled;
    private final String apiKey;
    private final String siteId;
    private final String notifyUrl;
    private final String returnUrl;

    public CinetPayService(PaymentTransactionRepository payments, RestClient.Builder builder,
            @Value("${order.cinetpay.enabled:false}") boolean enabled,
            @Value("${order.cinetpay.api-key:}") String apiKey,
            @Value("${order.cinetpay.site-id:}") String siteId,
            @Value("${order.cinetpay.base-url:https://api-checkout.cinetpay.com}") String baseUrl,
            @Value("${order.cinetpay.notify-url:}") String notifyUrl,
            @Value("${order.cinetpay.return-url:}") String returnUrl) {
        this.payments = payments;
        this.client = builder.baseUrl(baseUrl).build();
        this.enabled = enabled;
        this.apiKey = apiKey;
        this.siteId = siteId;
        this.notifyUrl = notifyUrl;
        this.returnUrl = returnUrl;
    }

    @Transactional
    public PaymentResponse initiate(CardPaymentInitiationRequest request) {
        ensureConfigured();
        Plan plan = Plan.fromCode(request.planCode());
        PaymentTransaction payment = new PaymentTransaction();
        payment.setPlanCode(plan.code());
        payment.setAmountXaf(plan.amountXaf());
        payment.setPhoneNumber(request.phoneNumber().replaceAll("\\s", ""));
        payment.setOperator("CARD");
        payment.setProvider("CINETPAY");
        payment.setCustomerEmail(request.email());
        payment = payments.save(payment);
        String transactionId = payment.getReference().replace("-", "");
        payment.setProviderMessageId(transactionId);
        payments.save(payment);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("apikey", apiKey);
        payload.put("site_id", siteId);
        payload.put("transaction_id", transactionId);
        payload.put("amount", plan.amountXaf());
        payload.put("currency", "XAF");
        payload.put("description", "Abonnement GeneaTreePro " + plan.label());
        payload.put("notify_url", notifyUrl);
        payload.put("return_url", returnUrl);
        payload.put("channels", "CREDIT_CARD");
        payload.put("lang", "FR");
        payload.put("metadata", payment.getReference());
        payload.put("customer_name", request.lastName());
        payload.put("customer_surname", request.firstName());
        payload.put("customer_email", request.email());
        payload.put("customer_phone_number", request.phoneNumber());
        payload.put("customer_address", request.address());
        payload.put("customer_city", request.city());
        payload.put("customer_country", "CM");
        payload.put("customer_state", "CM");
        payload.put("customer_zip_code", "00000");
        try {
            JsonNode result = client.post().uri("/v2/payment").contentType(MediaType.APPLICATION_JSON)
                    .header("User-Agent", "GeneaTreePro/1.0").body(payload).retrieve().body(JsonNode.class);
            String paymentUrl = result == null ? null : result.path("data").path("payment_url").asText(null);
            if (paymentUrl == null || paymentUrl.isBlank()) throw new PaymentGatewayException("Le guichet carte est indisponible");
            return new PaymentResponse(payment.getReference(), payment.getStatus().name(), payment.getPlanCode(),
                    payment.getAmountXaf(), "Vous allez rejoindre le guichet bancaire sécurisé.", paymentUrl);
        } catch (RestClientResponseException exception) {
            payment.setStatus(PaymentTransaction.Status.FAILED);
            payments.save(payment);
            throw new PaymentGatewayException("Le paiement par carte n'a pas pu être initialisé", exception);
        }
    }

    @Transactional
    public void verifyCallback(String transactionId) {
        if (transactionId == null || transactionId.isBlank()) return;
        PaymentTransaction payment = payments.findByProviderMessageId(transactionId).orElse(null);
        if (payment == null || payment.getStatus() == PaymentTransaction.Status.SUCCESSFUL) return;
        Map<String, String> payload = Map.of("apikey", apiKey, "site_id", siteId, "transaction_id", transactionId);
        JsonNode result = client.post().uri("/v2/payment/check").contentType(MediaType.APPLICATION_JSON)
                .header("User-Agent", "GeneaTreePro/1.0").body(payload).retrieve().body(JsonNode.class);
        JsonNode data = result == null ? null : result.path("data");
        if (data == null || !data.isObject()) return;
        long amount = data.path("amount").asLong(-1);
        String currency = data.path("currency").asText("");
        if (amount != payment.getAmountXaf() || !"XAF".equalsIgnoreCase(currency)) return;
        String status = data.path("status").asText("").toUpperCase(Locale.ROOT);
        if ("ACCEPTED".equals(status)) {
            payment.setStatus(PaymentTransaction.Status.SUCCESSFUL);
            payment.setPaidAt(Instant.now());
        } else if ("REFUSED".equals(status) || "CANCELLED".equals(status)) {
            payment.setStatus(PaymentTransaction.Status.FAILED);
        }
        payments.save(payment);
    }

    private void ensureConfigured() {
        if (!enabled || apiKey.isBlank() || siteId.isBlank() || notifyUrl.isBlank() || returnUrl.isBlank())
            throw new PaymentGatewayException("Le paiement par carte est temporairement indisponible");
    }

    private record Plan(String code, String label, long amountXaf) {
        static Plan fromCode(String code) {
            return switch (code.toUpperCase(Locale.ROOT)) {
                case "FAMILY_MONTHLY" -> new Plan("FAMILY_MONTHLY", "Famille mensuel", 3500);
                case "HERITAGE_YEARLY" -> new Plan("HERITAGE_YEARLY", "Heritage annuel", 35000);
                default -> throw new IllegalArgumentException("Forfait payant inconnu");
            };
        }
    }
}
