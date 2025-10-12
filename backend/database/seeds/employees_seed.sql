USE attendance_system;

-- Insert sample employees
INSERT INTO employees (user_id, employee_id, first_name, last_name, phone, department, position, hire_date, salary, status) VALUES
(1, 'EMP001', 'Admin', 'System', '081234567890', 'IT', 'System Administrator', '2024-01-01', 15000000.00, 'active'),
(2, 'EMP002', 'HR', 'Manager', '081234567891', 'HR', 'HR Manager', '2024-01-15', 12000000.00, 'active'),
(3, 'EMP003', 'Project', 'Manager', '081234567892', 'IT', 'Project Manager', '2024-02-01', 13000000.00, 'active');

-- Insert company settings
INSERT INTO company_settings (setting_key, setting_value, description) VALUES
('company_name', 'AttendanceHub', 'Nama perusahaan'),
('work_start_time', '08:00', 'Jam kerja mulai'),
('work_end_time', '17:00', 'Jam kerja selesai'),
('break_duration', '60', 'Durasi istirahat (menit)'),
('late_threshold', '15', 'Batas terlambat (menit)'),
('overtime_threshold', '480', 'Batas overtime (menit)'),
('office_latitude', '-6.2088', 'Latitude kantor'),
('office_longitude', '106.8456', 'Longitude kantor'),
('office_radius', '100', 'Radius kantor (meter)'),
('timezone', 'Asia/Jakarta', 'Timezone perusahaan');

-- Insert default work schedules (Monday to Friday, 8 AM to 5 PM)
INSERT INTO work_schedules (employee_id, day_of_week, start_time, end_time, break_duration) VALUES
-- Admin
(1, 1, '08:00', '17:00', 60),
(1, 2, '08:00', '17:00', 60),
(1, 3, '08:00', '17:00', 60),
(1, 4, '08:00', '17:00', 60),
(1, 5, '08:00', '17:00', 60),
-- HR Manager
(2, 1, '08:00', '17:00', 60),
(2, 2, '08:00', '17:00', 60),
(2, 3, '08:00', '17:00', 60),
(2, 4, '08:00', '17:00', 60),
(2, 5, '08:00', '17:00', 60),
-- Project Manager
(3, 1, '08:00', '17:00', 60),
(3, 2, '08:00', '17:00', 60),
(3, 3, '08:00', '17:00', 60),
(3, 4, '08:00', '17:00', 60),
(3, 5, '08:00', '17:00', 60);