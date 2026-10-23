package com.example.geneatree.controller;

import com.example.geneatree.dto.AuthenticatedUserDTO;
import com.example.geneatree.dto.AccountExportDTO;
import com.example.geneatree.dto.RegisterRequest;
import com.example.geneatree.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AccountService accountService;

    public AuthController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthenticatedUserDTO register(@Valid @RequestBody RegisterRequest request) {
        return accountService.register(request);
    }

    @GetMapping("/me")
    public AuthenticatedUserDTO me(Authentication authentication) {
        return accountService.describeByEmail(authentication.getName());
    }

    @GetMapping("/export")
    public AccountExportDTO export(Authentication authentication) {
        return accountService.exportByEmail(authentication.getName());
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> delete(Authentication authentication) {
        accountService.deleteByEmail(authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
