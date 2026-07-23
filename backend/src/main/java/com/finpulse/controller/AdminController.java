package com.finpulse.controller;

import com.finpulse.dto.ApiResponse;
import com.finpulse.entity.Expense;
import com.finpulse.entity.Loan;
import com.finpulse.entity.User;
import com.finpulse.repository.ExpenseRepository;
import com.finpulse.repository.LoanRepository;
import com.finpulse.repository.UserRepository;
import com.finpulse.service.LoanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private LoanService loanService;

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success("All users fetched", userRepository.findAll()));
    }

    @GetMapping("/loans")
    public ResponseEntity<ApiResponse<List<Loan>>> getAllLoans() {
        return ResponseEntity.ok(ApiResponse.success("All loans fetched", loanRepository.findAll()));
    }

    @PutMapping("/loans/{id}/approve")
    public ResponseEntity<ApiResponse<Loan>> approveLoan(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Loan approved", loanService.approveLoan(id)));
    }

    @PutMapping("/loans/{id}/reject")
    public ResponseEntity<ApiResponse<Loan>> rejectLoan(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Loan rejected", loanService.rejectLoan(id)));
    }

    @GetMapping("/expenses")
    public ResponseEntity<ApiResponse<List<Expense>>> getAllExpenses() {
        return ResponseEntity.ok(ApiResponse.success("All expenses fetched", expenseRepository.findAll()));
    }
}
