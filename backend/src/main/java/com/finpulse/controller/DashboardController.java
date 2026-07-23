package com.finpulse.controller;

import com.finpulse.dto.ApiResponse;
import com.finpulse.dto.DashboardResponse;
import com.finpulse.service.DashboardService;
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
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private UserRepository userRepository;

    private Long getUserId(Authentication auth) {
        String email = ((UserDetails) auth.getPrincipal()).getUsername();
        return userRepository.findByEmail(email).get().getId();
    }

    @GetMapping
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Dashboard data fetched", dashboardService.getDashboardData(getUserId(auth))));
    }

    @GetMapping("/category-breakdown")
    public ResponseEntity<ApiResponse<Map<String, Double>>> getCategoryBreakdown(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Category breakdown fetched", dashboardService.getCategoryBreakdown(getUserId(auth))));
    }

    @GetMapping("/monthly-trend")
    public ResponseEntity<ApiResponse<Map<String, Double>>> getMonthlyTrend(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Monthly trend fetched", dashboardService.getMonthlyExpenseTrend(getUserId(auth))));
    }
}
