package com.finpulse.repository;

import com.finpulse.entity.EmiPayment;
import com.finpulse.entity.EmiStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EmiPaymentRepository extends JpaRepository<EmiPayment, Long> {
    List<EmiPayment> findByLoanId(Long loanId);
    List<EmiPayment> findByUserIdAndStatus(Long userId, EmiStatus status);
    List<EmiPayment> findByDueDateBeforeAndStatus(LocalDate date, EmiStatus status);
    Long countByLoanIdAndStatus(Long loanId, EmiStatus status);
}
