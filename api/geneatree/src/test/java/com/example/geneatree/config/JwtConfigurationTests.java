package com.example.geneatree.config;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.JwtException;
import java.time.Instant;
import java.util.Date;
import java.nio.charset.StandardCharsets;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtConfigurationTests {
    @Test
    void missingProductionSecretDoesNotEnableThePublicTestSigningKey() throws Exception {
        String issuer = "https://example.invalid/auth/v1";
        var decoder = new SecurityConfig().jwtDecoder(issuer, "https://example.invalid/jwks", "");
        var jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), new JWTClaimsSet.Builder()
                .issuer(issuer).audience("authenticated").claim("email", "kouokamasaph142@gmail.com")
                .expirationTime(Date.from(Instant.now().plusSeconds(300))).build());
        jwt.sign(new MACSigner("geneatree-test-secret-at-least-32-bytes".getBytes(StandardCharsets.UTF_8)));
        assertThrows(JwtException.class, () -> decoder.decode(jwt.serialize()));
    }
}
