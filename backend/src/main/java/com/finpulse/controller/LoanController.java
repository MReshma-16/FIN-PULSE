package com.finpulse.controller;

import com.finpulse.dto.ApiResponse;
import com.finpulse.dto.LoanRequest;
import com.finpulse.entity.Loan;
import com.finpulse.service.LoanService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import com.finpulse.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    @Autowired
    private LoanService loanService;
    
    @Autowired
    private UserRepository userRepository;

    private Long getUserId(Authentication auth) {
        String email = ((UserDetails) auth.getPrincipal()).getUsername();
        return userRepository.findByEmail(email).get().getId();
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Loan>> createLoan(@Valid @RequestBody LoanRequest request, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Loan application submitted", loanService.createLoan(request, getUserId(auth))));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Loan>>> getUserLoans(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("User loans fetched", loanService.getLoansByUser(getUserId(auth))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Loan>> getLoanById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Loan fetched", loanService.getLoanById(id)));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<Loan>> approveLoan(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Loan approved", loanService.approveLoan(id)));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<Loan>> rejectLoan(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Loan rejected", loanService.rejectLoan(id)));
    }
}
