package com.finpulse.controller;

import com.finpulse.dto.ApiResponse;
import com.finpulse.dto.ExpenseRequest;
import com.finpulse.entity.Expense;
import com.finpulse.service.ExpenseService;
import com.finpulse.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private UserRepository userRepository;

    private Long getUserId(Authentication auth) {
        String email = ((UserDetails) auth.getPrincipal()).getUsername();
        return userRepository.findByEmail(email).get().getId();
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Expense>> addExpense(@Valid @RequestBody ExpenseRequest request, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Expense added", expenseService.addExpense(request, getUserId(auth))));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Expense>>> getUserExpenses(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("User expenses fetched", expenseService.getExpensesByUser(getUserId(auth))));
    }

    @GetMapping("/loan/{loanId}")
    public ResponseEntity<ApiResponse<List<Expense>>> getExpensesByLoan(@PathVariable Long loanId) {
        return ResponseEntity.ok(ApiResponse.success("Loan expenses fetched", expenseService.getExpensesByLoan(loanId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Expense>> updateExpense(@PathVariable Long id, @Valid @RequestBody ExpenseRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Expense updated", expenseService.updateExpense(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteExpense(@PathVariable Long id) {
        expenseService.deleteExpense(id);
        return ResponseEntity.ok(ApiResponse.success("Expense deleted", null));
    }
}
