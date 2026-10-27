package com.example.geneatree.service;

import com.example.geneatree.dto.PaymentInitiationRequest;
import com.example.geneatree.dto.PaymentResponse;
import com.example.geneatree.entity.PaymentTransaction;
import com.example.geneatree.repository.PaymentTransactionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
public class G2tPayService {
    private static final Logger log = LoggerFactory.getLogger(G2tPayService.class);
    private final PaymentTransactionRepository payments;
    private final RestClient client;
    private final boolean enabled;
    private final String apiKey;
    private final String webhookUrl;
    private final String mtnOperator;
    private final String orangeOperator;
    private final ObjectMapper objectMapper;

    public G2tPayService(PaymentTransactionRepository payments, RestClient.Builder restClientBuilder, ObjectMapper objectMapper,
            @Value("${order.g2tpay.enabled:true}") boolean enabled,
            @Value("${order.g2tpay.api-key:}") String apiKey,
            @Value("${order.g2tpay.base-url:https://g2tpay.net}") String baseUrl,
            @Value("${order.g2tpay.webhook-url:}") String webhookUrl,
            @Value("${order.g2tpay.gateway-public-url:}") String gatewayPublicUrl,
            @Value("${order.g2tpay.operator-mtn:MTN_CMR}") String mtnOperator,
            @Value("${order.g2tpay.operator-orange:ORANGE_CMR}") String orangeOperator) {
        this.payments = payments;
        this.objectMapper = objectMapper;
        this.client = restClientBuilder.baseUrl(baseUrl).build();
        this.enabled = enabled;
        this.apiKey = apiKey;
        this.webhookUrl = webhookUrl.isBlank() && !gatewayPublicUrl.isBlank()
                ? gatewayPublicUrl.replaceAll("/$", "") + "/api/payments/g2tpay/callback" : webhookUrl;
        this.mtnOperator = mtnOperator;
        this.orangeOperator = orangeOperator;
    }

    @Transactional
    public PaymentResponse initiate(PaymentInitiationRequest request) {
        ensureConfigured();
        Plan plan = Plan.fromCode(request.planCode());
        PaymentTransaction payment = new PaymentTransaction();
        payment.setPlanCode(plan.code());
        payment.setAmountXaf(plan.amountXaf());
        payment.setPhoneNumber(normalizePhone(request.phoneNumber()));
        payment.setOperator("MTN".equals(request.operator()) ? mtnOperator : orangeOperator);
        payment.setProvider("G2TPAY");
        payment.setCustomerEmail(request.email());
        payment = payments.save(payment);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("apiKey", apiKey);
        payload.put("amount", payment.getAmountXaf());
        payload.put("phoneNumber", payment.getPhoneNumber());
        payload.put("operator", payment.getOperator());
        payload.put("description", "GeneaTreePro - abonnement " + plan.label());
        payload.put("external_reference", payment.getReference());
        payload.put("webhook_url", webhookUrl);
        try {
            JsonNode result = client.post().uri("/api/payments/initiate-sdk").contentType(MediaType.APPLICATION_JSON)
                    .body(payload).retrieve().body(JsonNode.class);
            String messageId = firstText(result, "MessageId", "messageId", "transactionId", "id");
            if (messageId == null && result != null) messageId = firstText(result.path("data"), "txnid", "MessageId", "messageId", "id");
            payment.setProviderMessageId(messageId);
            return response(payments.save(payment), "Validez la demande Mobile Money sur votre téléphone.");
        } catch (RestClientResponseException exception) {
            payment.setStatus(PaymentTransaction.Status.FAILED);
            payments.save(payment);
            String providerMessage = providerMessage(exception.getResponseBodyAsString());
            log.warn("G2TPay initiation rejected with HTTP {}: {}", exception.getStatusCode().value(), providerMessage);
            throw new PaymentGatewayException(providerMessage == null
                    ? "Le paiement Mobile Money a été refusé. Vérifiez le numéro et réessayez."
                    : "Paiement refusé : " + providerMessage, exception);
        }
    }

    @Transactional(readOnly = true)
    public PaymentResponse status(String reference) {
        return response(payments.findByReference(reference)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", reference)), null);
    }

    @Transactional
    public void handleCallback(JsonNode payload) {
        String messageId = firstText(payload, "MessageId", "messageId");
        JsonNode data = payload.path("data");
        if (messageId == null) messageId = firstText(data, "txnid", "MessageId", "messageId");
        if (messageId == null) messageId = firstText(payload.path("parameters"), "MessageId", "messageId");
        if (messageId == null) return;
        PaymentTransaction payment = payments.findByProviderMessageId(messageId).orElse(null);
        if (payment == null || payment.getStatus() == PaymentTransaction.Status.SUCCESSFUL) return;
        String rawAmount = firstText(payload, "Amount", "amount");
        if (rawAmount == null) rawAmount = firstText(data, "amount", "Amount");
        if (rawAmount != null && !amountMatches(rawAmount, payment.getAmountXaf())) return;
        String rawStatus = firstText(payload, "Status", "status");
        if (rawStatus == null) rawStatus = firstText(data, "status", "Status");
        PaymentTransaction.Status status = normalizeStatus(rawStatus);
        payment.setStatus(status);
        if (status == PaymentTransaction.Status.SUCCESSFUL) payment.setPaidAt(Instant.now());
        payments.save(payment);
    }

    private void ensureConfigured() {
        if (!enabled) throw new PaymentGatewayException("Les paiements Mobile Money sont temporairement désactivés");
        if (apiKey.isBlank() || webhookUrl.isBlank())
            throw new PaymentGatewayException("Le paiement Mobile Money est temporairement indisponible");
    }
    private String normalizePhone(String phone) {
        String digits = phone.replaceAll("\\D", "");
        return digits.startsWith("237") ? digits.substring(3) : digits;
    }
    private PaymentTransaction.Status normalizeStatus(String status) {
        if (status == null) return PaymentTransaction.Status.PENDING;
        return switch (status.toUpperCase(Locale.ROOT)) {
            case "SUCCESSFUL", "SUCCESS", "COMPLETED", "PAID" -> PaymentTransaction.Status.SUCCESSFUL;
            case "FAILED", "FAILURE", "REJECTED" -> PaymentTransaction.Status.FAILED;
            case "CANCELLED", "CANCELED", "EXPIRED" -> PaymentTransaction.Status.CANCELLED;
            default -> PaymentTransaction.Status.PENDING;
        };
    }
    private String firstText(JsonNode node, String... fields) {
        if (node == null) return null;
        for (String field : fields) if (node.path(field).isValueNode() && !node.path(field).asText().isBlank()) return node.path(field).asText();
        return null;
    }
    private boolean amountMatches(String rawAmount, long expectedAmount) {
        try { return Long.parseLong(rawAmount.replaceAll("\\.0+$", "")) == expectedAmount; }
        catch (NumberFormatException exception) { return false; }
    }
    private String providerMessage(String body) {
        if (body == null || body.isBlank()) return null;
        try {
            JsonNode json = objectMapper.readTree(body);
            String message = firstText(json, "message", "error", "detail", "description");
            if (message == null && json.path("errors").isObject()) message = json.path("errors").toString();
            return message == null || message.length() > 240 ? null : message;
        } catch (Exception ignored) {
            return null;
        }
    }
    private PaymentResponse response(PaymentTransaction payment, String message) {
        return new PaymentResponse(payment.getReference(), payment.getStatus().name(), payment.getPlanCode(), payment.getAmountXaf(), message, null);
    }
    private record Plan(String code, String label, long amountXaf) {
        static Plan fromCode(String code) {
            return switch (code.toUpperCase(Locale.ROOT)) {
                case "FAMILY_MONTHLY" -> new Plan("FAMILY_MONTHLY", "Famille mensuel", 3500);
                case "HERITAGE_YEARLY" -> new Plan("HERITAGE_YEARLY", "Héritage annuel", 35000);
                default -> throw new IllegalArgumentException("Forfait payant inconnu");
            };
        }
    }
}
