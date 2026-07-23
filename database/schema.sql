-- =====================================================
-- FIN PULSE - Smart Loan Utilization via Mobile
-- Database Schema for MySQL
-- =====================================================
-- Run this script to create the complete database schema
-- Usage: mysql -u root -p < schema.sql
-- =====================================================

-- Create the database
CREATE DATABASE IF NOT EXISTS finpulse_db;
USE finpulse_db;

-- =====================================================
-- 1. USERS TABLE
-- Stores user registration and profile data
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL COMMENT 'User full name',
    email VARCHAR(150) NOT NULL UNIQUE COMMENT 'User email for login',
    phone_number VARCHAR(15) NOT NULL COMMENT '10-digit phone number',
    password VARCHAR(255) NOT NULL COMMENT 'BCrypt hashed password',
    firebase_uid VARCHAR(128) COMMENT 'Firebase Authentication UID',
    profile_picture VARCHAR(500) COMMENT 'URL to profile picture',
    role ENUM('USER', 'ADMIN') DEFAULT 'USER' COMMENT 'User role for authorization',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Account active status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_firebase_uid (firebase_uid),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User accounts and profiles';

-- =====================================================
-- 2. LOANS TABLE
-- Stores loan application and calculation details
-- =====================================================
CREATE TABLE IF NOT EXISTS loans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT 'FK to users table',
    loan_type ENUM('PERSONAL', 'EDUCATION', 'HOME', 'VEHICLE', 'BUSINESS', 'AGRICULTURE') NOT NULL COMMENT 'Type of loan',
    loan_amount DECIMAL(15, 2) NOT NULL COMMENT 'Sanctioned loan amount',
    interest_rate DECIMAL(5, 2) NOT NULL COMMENT 'Annual interest rate percentage',
    loan_tenure INT NOT NULL COMMENT 'Loan tenure in years',
    purpose_of_loan VARCHAR(500) COMMENT 'Purpose description',
    monthly_income DECIMAL(12, 2) COMMENT 'Monthly income of applicant',
    monthly_emi DECIMAL(12, 2) NOT NULL COMMENT 'Calculated monthly EMI',
    total_interest DECIMAL(15, 2) NOT NULL COMMENT 'Total interest over tenure',
    total_repayment DECIMAL(15, 2) NOT NULL COMMENT 'Total amount to be repaid',
    utilized_amount DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'Total amount utilized from loan',
    remaining_balance DECIMAL(15, 2) COMMENT 'Remaining loan balance',
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CLOSED') DEFAULT 'PENDING' COMMENT 'Loan application status',
    approved_date DATE COMMENT 'Date loan was approved',
    start_date DATE COMMENT 'EMI start date',
    end_date DATE COMMENT 'Loan end date',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_loan_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_loan_type (loan_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Loan applications and details';

-- =====================================================
-- 3. EXPENSES TABLE
-- Tracks loan utilization expenses
-- =====================================================
CREATE TABLE IF NOT EXISTS expenses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    loan_id BIGINT NOT NULL COMMENT 'FK to loans table',
    user_id BIGINT NOT NULL COMMENT 'FK to users table',
    expense_name VARCHAR(200) NOT NULL COMMENT 'Name/title of expense',
    expense_amount DECIMAL(12, 2) NOT NULL COMMENT 'Expense amount',
    category ENUM('EDUCATION', 'MEDICAL', 'BUSINESS', 'PERSONAL', 'HOME', 'AGRICULTURE', 'OTHER') NOT NULL COMMENT 'Expense category',
    expense_date DATE NOT NULL COMMENT 'Date of expense',
    description TEXT COMMENT 'Optional description',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_expense_loan FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
    CONSTRAINT fk_expense_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_loan_id (loan_id),
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_expense_date (expense_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Expense tracking for loan utilization';

-- =====================================================
-- 4. EMI_PAYMENTS TABLE
-- Tracks monthly EMI payments
-- =====================================================
CREATE TABLE IF NOT EXISTS emi_payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    loan_id BIGINT NOT NULL COMMENT 'FK to loans table',
    user_id BIGINT NOT NULL COMMENT 'FK to users table',
    emi_number INT NOT NULL COMMENT 'EMI installment number',
    emi_amount DECIMAL(12, 2) NOT NULL COMMENT 'EMI amount for this payment',
    principal_component DECIMAL(12, 2) COMMENT 'Principal portion of EMI',
    interest_component DECIMAL(12, 2) COMMENT 'Interest portion of EMI',
    due_date DATE NOT NULL COMMENT 'EMI due date',
    paid_date DATE COMMENT 'Actual payment date',
    status ENUM('PENDING', 'PAID', 'OVERDUE') DEFAULT 'PENDING' COMMENT 'Payment status',
    remaining_balance DECIMAL(15, 2) COMMENT 'Outstanding balance after this EMI',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_emi_loan FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
    CONSTRAINT fk_emi_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_loan_id (loan_id),
    INDEX idx_user_id (user_id),
    INDEX idx_due_date (due_date),
    INDEX idx_status (status),
    UNIQUE KEY uk_loan_emi (loan_id, emi_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='EMI payment tracking and history';

-- =====================================================
-- 5. NOTIFICATIONS TABLE
-- Stores user notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT 'FK to users table',
    title VARCHAR(200) NOT NULL COMMENT 'Notification title',
    message TEXT NOT NULL COMMENT 'Notification message body',
    type ENUM('EMI_REMINDER', 'EMI_PAID', 'LOAN_APPROVED', 'LOAN_REJECTED', 'MONTHLY_SUMMARY', 'BUDGET_ALERT', 'GENERAL') NOT NULL COMMENT 'Notification type',
    is_read BOOLEAN DEFAULT FALSE COMMENT 'Read status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User notifications and alerts';

-- =====================================================
-- 6. REPORTS TABLE
-- Metadata for generated reports
-- =====================================================
CREATE TABLE IF NOT EXISTS reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT 'FK to users table',
    report_type ENUM('LOAN_SUMMARY', 'EXPENSE_REPORT', 'EMI_REPORT', 'MONTHLY_SPENDING', 'LOAN_UTILIZATION') NOT NULL COMMENT 'Type of report',
    report_name VARCHAR(200) NOT NULL COMMENT 'Report display name',
    file_format ENUM('PDF', 'EXCEL') NOT NULL COMMENT 'Export format',
    file_path VARCHAR(500) COMMENT 'Path to generated report file',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_report_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_report_type (report_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Generated report metadata';

-- =====================================================
-- VIEWS for common queries
-- =====================================================

-- View: Loan summary with utilization percentage
CREATE OR REPLACE VIEW v_loan_summary AS
SELECT 
    l.id AS loan_id,
    u.full_name,
    u.email,
    l.loan_type,
    l.loan_amount,
    l.monthly_emi,
    l.total_interest,
    l.total_repayment,
    l.utilized_amount,
    (l.loan_amount - l.utilized_amount) AS remaining_balance,
    ROUND((l.utilized_amount / l.loan_amount) * 100, 2) AS utilization_percentage,
    l.status,
    l.interest_rate,
    l.loan_tenure
FROM loans l
JOIN users u ON l.user_id = u.id;

-- View: EMI payment summary per loan
CREATE OR REPLACE VIEW v_emi_summary AS
SELECT 
    loan_id,
    COUNT(*) AS total_emis,
    SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) AS paid_emis,
    SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_emis,
    SUM(CASE WHEN status = 'OVERDUE' THEN 1 ELSE 0 END) AS overdue_emis,
    SUM(CASE WHEN status = 'PAID' THEN emi_amount ELSE 0 END) AS total_paid_amount,
    SUM(CASE WHEN status != 'PAID' THEN emi_amount ELSE 0 END) AS outstanding_amount,
    MIN(CASE WHEN status = 'PENDING' THEN due_date END) AS next_emi_date
FROM emi_payments
GROUP BY loan_id;

-- View: Expense summary by category
CREATE OR REPLACE VIEW v_expense_by_category AS
SELECT 
    user_id,
    loan_id,
    category,
    COUNT(*) AS expense_count,
    SUM(expense_amount) AS total_amount
FROM expenses
GROUP BY user_id, loan_id, category;
