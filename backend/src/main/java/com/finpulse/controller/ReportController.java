package com.finpulse.controller;

import com.finpulse.dto.ApiResponse;
import com.finpulse.service.ReportService;
import com.finpulse.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @Autowired
    private UserRepository userRepository;

    private Long getUserId(Authentication auth) {
        String email = ((UserDetails) auth.getPrincipal()).getUsername();
        return userRepository.findByEmail(email).get().getId();
    }

    @GetMapping("/loan-summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLoanSummary(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Loan summary generated", reportService.generateLoanSummary(getUserId(auth))));
    }

    @GetMapping("/expense-report")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getExpenseReport(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Expense report generated", reportService.generateExpenseReport(getUserId(auth))));
    }

    @GetMapping("/emi-report")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEmiReport(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("EMI report generated", reportService.generateEmiReport(getUserId(auth))));
    }
}
