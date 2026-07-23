package com.finpulse.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class DashboardResponse {
    private Double totalLoanAmount;
    private Double totalUtilizedAmount;
    private Double remainingBalance;
    private Double monthlyEmi;
    private String emiStatus;
    private String loanStatus;
    private Map<String, Double> categoryExpenses;
    private Map<String, Double> monthlyExpenses;
    private List<Object> recentExpenses;
    private Object upcomingEmi;
    private List<String> financialTips;
}
