package com.finpulse.dto;

import com.finpulse.entity.ExpenseCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ExpenseRequest {
    @NotNull(message = "Loan ID is required")
    private Long loanId;

    @NotBlank(message = "Expense name is required")
    private String expenseName;

    @NotNull(message = "Expense amount is required")
    @Positive(message = "Expense amount must be positive")
    private Double expenseAmount;

    @NotNull(message = "Category is required")
    private ExpenseCategory category;

    @NotNull(message = "Expense date is required")
    private LocalDate expenseDate;

    private String description;
}
