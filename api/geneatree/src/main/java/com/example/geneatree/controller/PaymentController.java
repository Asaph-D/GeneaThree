package com.example.geneatree.controller;

import com.example.geneatree.dto.PaymentInitiationRequest;
import com.example.geneatree.dto.CardPaymentInitiationRequest;
import com.example.geneatree.dto.PaymentResponse;
import com.example.geneatree.service.G2tPayService;
import com.example.geneatree.service.CinetPayService;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final G2tPayService payments;
    private final CinetPayService cardPayments;
    public PaymentController(G2tPayService payments, CinetPayService cardPayments) { this.payments = payments; this.cardPayments = cardPayments; }
    @PostMapping("/initiate") public PaymentResponse initiate(@Valid @RequestBody PaymentInitiationRequest request) { return payments.initiate(request); }
    @GetMapping("/{reference}") public PaymentResponse status(@PathVariable String reference) { return payments.status(reference); }
    @PostMapping("/g2tpay/callback") public ResponseEntity<Map<String, Boolean>> callback(@RequestBody JsonNode payload) {
        payments.handleCallback(payload);
        return ResponseEntity.ok(Map.of("success", true));
    }
    @PostMapping("/card/initiate") public PaymentResponse initiateCard(@Valid @RequestBody CardPaymentInitiationRequest request) {
        return cardPayments.initiate(request);
    }
    @RequestMapping(value = "/cinetpay/callback", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<Void> cardCallback(@RequestParam Map<String, String> parameters) {
        String transactionId = parameters.getOrDefault("transaction_id", parameters.get("cpm_trans_id"));
        cardPayments.verifyCallback(transactionId);
        return ResponseEntity.ok().build();
    }
}
