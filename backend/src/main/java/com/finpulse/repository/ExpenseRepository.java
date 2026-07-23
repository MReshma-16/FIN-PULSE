package com.finpulse.repository;

import com.finpulse.entity.Expense;
import com.finpulse.entity.ExpenseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByLoanId(Long loanId);
    List<Expense> findByUserId(Long userId);
    List<Expense> findByUserIdAndCategory(Long userId, ExpenseCategory category);
    List<Expense> findByExpenseDateBetween(LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT SUM(e.expenseAmount) FROM Expense e WHERE e.loan.id = :loanId")
    Double sumByLoanId(@Param("loanId") Long loanId);
}
