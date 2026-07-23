-- =====================================================
-- FIN PULSE - Seed Data for Testing
-- =====================================================
USE finpulse_db;

-- =====================================================
-- Sample Admin User (password: Admin@123)
-- BCrypt hash for 'Admin@123'
-- =====================================================
INSERT INTO users (full_name, email, phone_number, password, role, is_active) VALUES
('Admin User', 'admin@finpulse.com', '9876543210', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN', TRUE),
('Rahul Kumar', 'rahul@example.com', '9876543211', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'USER', TRUE),
('Priya Sharma', 'priya@example.com', '9876543212', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'USER', TRUE);

-- =====================================================
-- Sample Loans
-- =====================================================
INSERT INTO loans (user_id, loan_type, loan_amount, interest_rate, loan_tenure, purpose_of_loan, monthly_income, monthly_emi, total_interest, total_repayment, utilized_amount, remaining_balance, status, approved_date, start_date) VALUES
(2, 'EDUCATION', 500000.00, 8.50, 5, 'Higher Education - MBA Program', 35000.00, 10247.00, 114820.00, 614820.00, 125000.00, 375000.00, 'APPROVED', '2026-01-15', '2026-02-01'),
(2, 'PERSONAL', 200000.00, 12.00, 3, 'Home Renovation', 35000.00, 6643.00, 39148.00, 239148.00, 50000.00, 150000.00, 'APPROVED', '2026-03-01', '2026-04-01'),
(3, 'HOME', 2500000.00, 7.50, 20, 'Purchase of 2BHK Apartment', 75000.00, 20145.00, 2334800.00, 4834800.00, 500000.00, 2000000.00, 'APPROVED', '2026-02-01', '2026-03-01'),
(3, 'VEHICLE', 800000.00, 9.00, 7, 'Purchase of Car', 75000.00, 12769.00, 272596.00, 1072596.00, 0.00, 800000.00, 'PENDING', NULL, NULL);

-- =====================================================
-- Sample Expenses for Rahul's Education Loan
-- =====================================================
INSERT INTO expenses (loan_id, user_id, expense_name, expense_amount, category, expense_date, description) VALUES
(1, 2, 'Semester 1 Tuition Fee', 75000.00, 'EDUCATION', '2026-02-10', 'First semester tuition fee payment'),
(1, 2, 'Books and Study Material', 15000.00, 'EDUCATION', '2026-02-15', 'Textbooks and reference materials'),
(1, 2, 'Laptop Purchase', 65000.00, 'PERSONAL', '2026-02-20', 'Laptop for coursework'),
(1, 2, 'Hostel Deposit', 25000.00, 'PERSONAL', '2026-03-01', 'Hostel security deposit'),
(1, 2, 'Medical Checkup', 5000.00, 'MEDICAL', '2026-03-15', 'Required medical examination'),
(2, 2, 'Kitchen Renovation', 30000.00, 'HOME', '2026-04-10', 'Kitchen cabinet and countertop'),
(2, 2, 'Bathroom Fittings', 20000.00, 'HOME', '2026-04-20', 'New bathroom fixtures');

-- =====================================================
-- Sample Expenses for Priya's Home Loan
-- =====================================================
INSERT INTO expenses (loan_id, user_id, expense_name, expense_amount, category, expense_date, description) VALUES
(3, 3, 'Registration Fees', 150000.00, 'HOME', '2026-03-05', 'Property registration charges'),
(3, 3, 'Interior Design', 200000.00, 'HOME', '2026-03-20', 'Interior design and furnishing'),
(3, 3, 'Appliances', 100000.00, 'HOME', '2026-04-01', 'Home appliances purchase'),
(3, 3, 'Moving Expenses', 50000.00, 'PERSONAL', '2026-04-10', 'Packers and movers');

-- =====================================================
-- Sample EMI Payments for Rahul's Education Loan
-- =====================================================
INSERT INTO emi_payments (loan_id, user_id, emi_number, emi_amount, principal_component, interest_component, due_date, paid_date, status, remaining_balance) VALUES
(1, 2, 1, 10247.00, 6705.00, 3542.00, '2026-02-01', '2026-02-01', 'PAID', 493295.00),
(1, 2, 2, 10247.00, 6753.00, 3494.00, '2026-03-01', '2026-03-01', 'PAID', 486542.00),
(1, 2, 3, 10247.00, 6800.00, 3447.00, '2026-04-01', '2026-04-02', 'PAID', 479742.00),
(1, 2, 4, 10247.00, 6849.00, 3398.00, '2026-05-01', '2026-05-01', 'PAID', 472893.00),
(1, 2, 5, 10247.00, 6897.00, 3350.00, '2026-06-01', '2026-06-01', 'PAID', 465996.00),
(1, 2, 6, 10247.00, 6946.00, 3301.00, '2026-07-01', NULL, 'PENDING', 459050.00),
(1, 2, 7, 10247.00, 6995.00, 3252.00, '2026-08-01', NULL, 'PENDING', 452055.00);

-- =====================================================
-- Sample Notifications
-- =====================================================
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
(2, 'EMI Due Reminder', 'Your EMI of ₹10,247 for Education Loan is due on July 1, 2026.', 'EMI_REMINDER', FALSE),
(2, 'Loan Approved', 'Your Personal Loan of ₹2,00,000 has been approved.', 'LOAN_APPROVED', TRUE),
(3, 'Loan Approved', 'Your Home Loan of ₹25,00,000 has been approved.', 'LOAN_APPROVED', TRUE),
(3, 'EMI Due Reminder', 'Your EMI of ₹20,145 for Home Loan is due on July 1, 2026.', 'EMI_REMINDER', FALSE),
(2, 'Monthly Financial Summary', 'Your June 2026 financial summary is ready. Total spending: ₹35,000.', 'MONTHLY_SUMMARY', FALSE);
