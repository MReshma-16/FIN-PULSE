package com.finpulse.dto;

import com.finpulse.entity.LoanType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class LoanRequest {
    @NotNull(message = "Loan type is required")
    private LoanType loanType;

    @NotNull(message = "Loan amount is required")
    @Positive(message = "Loan amount must be positive")
    private Double loanAmount;

    @NotNull(message = "Interest rate is required")
    @Positive(message = "Interest rate must be positive")
    private Double interestRate;

    @NotNull(message = "Loan tenure is required")
    @Positive(message = "Loan tenure must be positive")
    private Integer loanTenure;

    private String purposeOfLoan;

    private Double monthlyIncome;
}
