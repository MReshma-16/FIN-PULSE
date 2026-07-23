package com.finpulse.service;

import com.finpulse.dto.LoanRequest;
import com.finpulse.entity.*;
import com.finpulse.exception.BadRequestException;
import com.finpulse.exception.ResourceNotFoundException;
import com.finpulse.repository.EmiPaymentRepository;
import com.finpulse.repository.LoanRepository;
import com.finpulse.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class LoanService {

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EmiPaymentRepository emiPaymentRepository;
    
    @Autowired
    private NotificationService notificationService;

    public Loan createLoan(LoanRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        double p = request.getLoanAmount();
        double r = request.getInterestRate() / (12 * 100); // monthly interest rate
        int n = request.getLoanTenure();

        double emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        double totalRepayment = emi * n;
        double totalInterest = totalRepayment - p;

        Loan loan = Loan.builder()
                .user(user)
                .loanType(request.getLoanType())
                .loanAmount(p)
                .interestRate(request.getInterestRate())
                .loanTenure(n)
                .purposeOfLoan(request.getPurposeOfLoan())
                .monthlyIncome(request.getMonthlyIncome())
                .monthlyEmi(emi)
                .totalInterest(totalInterest)
                .totalRepayment(totalRepayment)
                .utilizedAmount(0.0)
                .remainingBalance(p)
                .status(LoanStatus.PENDING)
                .build();

        return loanRepository.save(loan);
    }

    public List<Loan> getLoansByUser(Long userId) {
        return loanRepository.findByUserId(userId);
    }
    
    public Loan getLoanById(Long loanId) {
        return loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));
    }

    public Loan approveLoan(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        if (loan.getStatus() != LoanStatus.PENDING) {
            throw new BadRequestException("Only pending loans can be approved");
        }

        loan.setStatus(LoanStatus.APPROVED);
        loan.setApprovedDate(LocalDate.now());
        loan.setStartDate(LocalDate.now());
        loan.setEndDate(LocalDate.now().plusMonths(loan.getLoanTenure()));

        Loan savedLoan = loanRepository.save(loan);
        
        generateEmiSchedule(savedLoan);
        
        notificationService.createNotification(
                savedLoan.getUser().getId(),
                "Loan Approved",
                "Your loan of " + savedLoan.getLoanAmount() + " has been approved.",
                NotificationType.LOAN_APPROVED
        );

        return savedLoan;
    }

    public Loan rejectLoan(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        if (loan.getStatus() != LoanStatus.PENDING) {
            throw new BadRequestException("Only pending loans can be rejected");
        }

        loan.setStatus(LoanStatus.REJECTED);
        
        notificationService.createNotification(
                loan.getUser().getId(),
                "Loan Rejected",
                "Your loan application for " + loan.getLoanAmount() + " has been rejected.",
                NotificationType.LOAN_REJECTED
        );
        
        return loanRepository.save(loan);
    }

    private void generateEmiSchedule(Loan loan) {
        double p = loan.getLoanAmount();
        double r = loan.getInterestRate() / (12 * 100);
        double emi = loan.getMonthlyEmi();
        double remainingBalance = p;
        
        LocalDate dueDate = loan.getStartDate().plusMonths(1);

        for (int i = 1; i <= loan.getLoanTenure(); i++) {
            double interestComponent = remainingBalance * r;
            double principalComponent = emi - interestComponent;
            remainingBalance -= principalComponent;
            
            if (i == loan.getLoanTenure()) {
                principalComponent += remainingBalance;
                remainingBalance = 0;
            }

            EmiPayment emiPayment = EmiPayment.builder()
                    .loan(loan)
                    .user(loan.getUser())
                    .emiNumber(i)
                    .emiAmount(emi)
                    .principalComponent(principalComponent)
                    .interestComponent(interestComponent)
                    .dueDate(dueDate)
                    .status(EmiStatus.PENDING)
                    .remainingBalance(Math.max(0, remainingBalance))
                    .build();

            emiPaymentRepository.save(emiPayment);
            dueDate = dueDate.plusMonths(1);
        }
    }
}
