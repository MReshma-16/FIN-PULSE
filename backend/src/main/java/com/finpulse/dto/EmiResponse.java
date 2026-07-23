package com.finpulse.dto;

import com.finpulse.entity.EmiStatus;
import com.finpulse.entity.LoanType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmiResponse {
    private Long id;
    private Integer emiNumber;
    private Double emiAmount;
    private Double principalComponent;
    private Double interestComponent;
    private LocalDate dueDate;
    private LocalDate paidDate;
    private EmiStatus status;
    private Double remainingBalance;
    
    private LoanType loanType;
    private Integer totalEmis;
    private Integer paidEmis;
    private Integer remainingEmis;
}
