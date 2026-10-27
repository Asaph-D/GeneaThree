package com.example.geneatree.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payment_transaction")
public class PaymentTransaction {
    public enum Status { PENDING, SUCCESSFUL, FAILED, CANCELLED }
    @Id private String id;
    @Column(nullable = false, unique = true) private String reference;
    @Column(unique = true) private String providerMessageId;
    @Column(nullable = false, length = 32) private String planCode;
    @Column(nullable = false) private long amountXaf;
    @Column(length = 20) private String phoneNumber;
    @Column(length = 24) private String operator;
    @Column(length = 24) private String provider;
    @Column(length = 320) private String customerEmail;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 24) private Status status = Status.PENDING;
    @Column(nullable = false, updatable = false) private Instant createdAt;
    @Column(nullable = false) private Instant updatedAt;
    private Instant paidAt;

    @PrePersist void initialize() {
        if (id == null) id = UUID.randomUUID().toString();
        if (reference == null) reference = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = createdAt;
    }
    public String getId() { return id; }
    public String getReference() { return reference; }
    public String getProviderMessageId() { return providerMessageId; }
    public void setProviderMessageId(String value) { providerMessageId = value; }
    public String getPlanCode() { return planCode; }
    public void setPlanCode(String value) { planCode = value; }
    public long getAmountXaf() { return amountXaf; }
    public void setAmountXaf(long value) { amountXaf = value; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String value) { phoneNumber = value; }
    public String getOperator() { return operator; }
    public void setOperator(String value) { operator = value; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String value) { customerEmail = value; }
    public String getProvider() { return provider; }
    public void setProvider(String value) { provider = value; }
    public Status getStatus() { return status; }
    public void setStatus(Status value) { status = value; updatedAt = Instant.now(); }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getPaidAt() { return paidAt; }
    public void setPaidAt(Instant value) { paidAt = value; }
}
