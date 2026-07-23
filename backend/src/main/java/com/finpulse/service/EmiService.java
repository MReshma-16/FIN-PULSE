package com.finpulse.service;

import com.finpulse.entity.*;
import com.finpulse.exception.BadRequestException;
import com.finpulse.exception.ResourceNotFoundException;
import com.finpulse.repository.EmiPaymentRepository;
import com.finpulse.repository.LoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class EmiService {

    @Autowired
    private EmiPaymentRepository emiPaymentRepository;

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private NotificationService notificationService;

    public List<EmiPayment> getEmisByLoan(Long loanId) {
        return emiPaymentRepository.findByLoanId(loanId);
    }

    public List<EmiPayment> getPaymentHistory(Long userId) {
        return emiPaymentRepository.findByUserIdAndStatus(userId, EmiStatus.PAID);
    }

    public List<EmiPayment> getUpcomingEmis(Long userId) {
        return emiPaymentRepository.findByUserIdAndStatus(userId, EmiStatus.PENDING);
    }

    public EmiPayment markEmiAsPaid(Long emiId) {
        EmiPayment emi = emiPaymentRepository.findById(emiId)
                .orElseThrow(() -> new ResourceNotFoundException("EMI not found"));

        if (emi.getStatus() == EmiStatus.PAID) {
            throw new BadRequestException("EMI is already marked as paid");
        }

        emi.setStatus(EmiStatus.PAID);
        emi.setPaidDate(LocalDate.now());
        
        Loan loan = emi.getLoan();
        loan.setRemainingBalance(emi.getRemainingBalance());
        
        if (emi.getRemainingBalance() <= 0) {
            loan.setStatus(LoanStatus.CLOSED);
        }
        
        loanRepository.save(loan);

        notificationService.createNotification(
                emi.getUser().getId(),
                "EMI Paid Successfully",
                "Your EMI of " + emi.getEmiAmount() + " for loan " + loan.getLoanType() + " has been received.",
                NotificationType.EMI_PAID
        );

        return emiPaymentRepository.save(emi);
    }
}
