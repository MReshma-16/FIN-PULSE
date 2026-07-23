package com.finpulse.controller;

import com.finpulse.dto.ApiResponse;
import com.finpulse.entity.EmiPayment;
import com.finpulse.service.EmiService;
import com.finpulse.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emi")
public class EmiController {

    @Autowired
    private EmiService emiService;

    @Autowired
    private UserRepository userRepository;

    private Long getUserId(Authentication auth) {
        String email = ((UserDetails) auth.getPrincipal()).getUsername();
        return userRepository.findByEmail(email).get().getId();
    }

    @GetMapping("/loan/{loanId}")
    public ResponseEntity<ApiResponse<List<EmiPayment>>> getEmisByLoan(@PathVariable Long loanId) {
        return ResponseEntity.ok(ApiResponse.success("EMIs fetched", emiService.getEmisByLoan(loanId)));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<EmiPayment>>> getPaymentHistory(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("EMI history fetched", emiService.getPaymentHistory(getUserId(auth))));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<ApiResponse<List<EmiPayment>>> getUpcomingEmis(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Upcoming EMIs fetched", emiService.getUpcomingEmis(getUserId(auth))));
    }

    @PutMapping("/{id}/pay")
    public ResponseEntity<ApiResponse<EmiPayment>> payEmi(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("EMI marked as paid", emiService.markEmiAsPaid(id)));
    }
}
