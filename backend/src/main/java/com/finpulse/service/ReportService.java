package com.finpulse.service;

import com.finpulse.repository.EmiPaymentRepository;
import com.finpulse.repository.ExpenseRepository;
import com.finpulse.repository.LoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class ReportService {

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private EmiPaymentRepository emiPaymentRepository;

    public Map<String, Object> generateLoanSummary(Long userId) {
        Map<String, Object> report = new HashMap<>();
        report.put("loans", loanRepository.findByUserId(userId));
        return report;
    }

    public Map<String, Object> generateExpenseReport(Long userId) {
        Map<String, Object> report = new HashMap<>();
        report.put("expenses", expenseRepository.findByUserId(userId));
        return report;
    }

    public Map<String, Object> generateEmiReport(Long userId) {
        Map<String, Object> report = new HashMap<>();
        report.put("paymentHistory", emiPaymentRepository.findByUserIdAndStatus(userId, com.finpulse.entity.EmiStatus.PAID));
        report.put("upcomingEmis", emiPaymentRepository.findByUserIdAndStatus(userId, com.finpulse.entity.EmiStatus.PENDING));
        return report;
    }
}
