package com.finpulse.service;

import com.finpulse.dto.ExpenseRequest;
import com.finpulse.entity.Expense;
import com.finpulse.entity.Loan;
import com.finpulse.entity.User;
import com.finpulse.exception.BadRequestException;
import com.finpulse.exception.ResourceNotFoundException;
import com.finpulse.repository.ExpenseRepository;
import com.finpulse.repository.LoanRepository;
import com.finpulse.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private UserRepository userRepository;

    public Expense addExpense(ExpenseRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Loan loan = loanRepository.findById(request.getLoanId())
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        if (!loan.getUser().getId().equals(userId)) {
            throw new BadRequestException("Unauthorized access to loan");
        }

        Expense expense = Expense.builder()
                .user(user)
                .loan(loan)
                .expenseName(request.getExpenseName())
                .expenseAmount(request.getExpenseAmount())
                .category(request.getCategory())
                .expenseDate(request.getExpenseDate())
                .description(request.getDescription())
                .build();

        Expense savedExpense = expenseRepository.save(expense);
        recalculateUtilization(loan.getId());
        return savedExpense;
    }

    public Expense updateExpense(Long expenseId, ExpenseRequest request) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));

        expense.setExpenseName(request.getExpenseName());
        expense.setExpenseAmount(request.getExpenseAmount());
        expense.setCategory(request.getCategory());
        expense.setExpenseDate(request.getExpenseDate());
        expense.setDescription(request.getDescription());

        Expense updatedExpense = expenseRepository.save(expense);
        recalculateUtilization(expense.getLoan().getId());
        return updatedExpense;
    }

    public void deleteExpense(Long expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));
        
        Long loanId = expense.getLoan().getId();
        expenseRepository.delete(expense);
        recalculateUtilization(loanId);
    }

    public List<Expense> getExpensesByLoan(Long loanId) {
        return expenseRepository.findByLoanId(loanId);
    }

    public List<Expense> getExpensesByUser(Long userId) {
        return expenseRepository.findByUserId(userId);
    }

    private void recalculateUtilization(Long loanId) {
        Loan loan = loanRepository.findById(loanId).orElseThrow();
        Double totalExpenses = expenseRepository.sumByLoanId(loanId);
        if (totalExpenses == null) totalExpenses = 0.0;
        
        loan.setUtilizedAmount(totalExpenses);
        loanRepository.save(loan);
    }
}
