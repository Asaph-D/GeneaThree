package com.example.geneatree.repository;

import com.example.geneatree.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, String> {
    Optional<PaymentTransaction> findByReference(String reference);
    Optional<PaymentTransaction> findByProviderMessageId(String providerMessageId);
}
