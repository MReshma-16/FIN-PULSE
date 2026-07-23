package com.finpulse.service;

import com.finpulse.dto.DashboardResponse;
import com.finpulse.entity.EmiPayment;
import com.finpulse.entity.EmiStatus;
import com.finpulse.entity.Expense;
import com.finpulse.entity.Loan;
import com.finpulse.repository.EmiPaymentRepository;
import com.finpulse.repository.ExpenseRepository;
import com.finpulse.repository.LoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private EmiPaymentRepository emiPaymentRepository;

    public DashboardResponse getDashboardData(Long userId) {
        List<Loan> loans = loanRepository.findByUserId(userId);
        List<Expense> expenses = expenseRepository.findByUserId(userId);
        List<EmiPayment> pendingEmis = emiPaymentRepository.findByUserIdAndStatus(userId, EmiStatus.PENDING);

        double totalLoan = loans.stream().mapToDouble(Loan::getLoanAmount).sum();
        double utilized = loans.stream().mapToDouble(Loan::getUtilizedAmount).sum();
        double remaining = loans.stream().mapToDouble(Loan::getRemainingBalance).sum();
        double totalEmi = loans.stream().mapToDouble(Loan::getMonthlyEmi).sum();

        Map<String, Double> categoryMap = expenses.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getCategory().name(),
                        Collectors.summingDouble(Expense::getExpenseAmount)
                ));

        Map<String, Double> monthlyMap = expenses.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getExpenseDate().getMonth().name(),
                        Collectors.summingDouble(Expense::getExpenseAmount)
                ));

        EmiPayment nextEmi = pendingEmis.stream()
                .min(Comparator.comparing(EmiPayment::getDueDate))
                .orElse(null);

        List<Object> recentExpenses = expenses.stream()
                .sorted(Comparator.comparing(Expense::getExpenseDate).reversed())
                .limit(5)
                .collect(Collectors.toList());

        List<String> tips = Arrays.asList(
                "Try to save at least 20% of your income.",
                "Review your expenses weekly to avoid overspending."
        );

        return DashboardResponse.builder()
                .totalLoanAmount(totalLoan)
                .totalUtilizedAmount(utilized)
                .remainingBalance(remaining)
                .monthlyEmi(totalEmi)
                .emiStatus(nextEmi != null ? "Next EMI on " + nextEmi.getDueDate() : "No pending EMIs")
                .loanStatus(loans.isEmpty() ? "No Active Loans" : loans.size() + " Active Loans")
                .categoryExpenses(categoryMap)
                .monthlyExpenses(monthlyMap)
                .recentExpenses(recentExpenses)
                .upcomingEmi(nextEmi)
                .financialTips(tips)
                .build();
    }

    public Map<String, Double> getCategoryBreakdown(Long userId) {
        return getDashboardData(userId).getCategoryExpenses();
    }

    public Map<String, Double> getMonthlyExpenseTrend(Long userId) {
        return getDashboardData(userId).getMonthlyExpenses();
    }
}
