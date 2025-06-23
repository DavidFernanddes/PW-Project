-- Database Creation Script for Task Management System
-- Projeto Fase 2 - Programação Web
-- Desenvolvido por: David Fernandes, João Rôlo, Sorin Revenco

-- Create database
CREATE DATABASE IF NOT EXISTS gestao_tarefas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gestao_tarefas;

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS task_logs;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS task_types;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT false,
    role ENUM('Administrador', 'Utilizador', 'Gestor') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_active (active),
    INDEX idx_role (role)
);

-- Create task_types table
CREATE TABLE task_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Create tasks table
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    end_date DATE NOT NULL,
    completed BOOLEAN DEFAULT false,
    user_id INT NOT NULL,
    type_id INT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (type_id) REFERENCES task_types(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type_id (type_id),
    INDEX idx_completed (completed),
    INDEX idx_end_date (end_date),
    INDEX idx_created_by (created_by)
);

-- Create task_logs table for audit trail
CREATE TABLE task_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT,
    user_id INT NOT NULL,
    action ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    old_values JSON,
    new_values JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_task_id (task_id),
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

-- Insert default admin user (password: admin123)
INSERT INTO users (name, username, password, active, role) VALUES 
('Administrador', 'admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeAdvqhXiwHEKCvAO', true, 'Administrador');

-- Insert sample task types
INSERT INTO task_types (name) VALUES 
('Desenvolvimento'),
('Análise'),
('Teste'),
('Documentação'),
('Reunião');

-- Insert sample users
INSERT INTO users (name, username, password, active, role) VALUES 
('João Silva', 'jsilva', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeAdvqhXiwHEKCvAO', true, 'Utilizador'),
('Ana Costa', 'acosta', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeAdvqhXiwHEKCvAO', true, 'Gestor'),
('Pedro Santos', 'psantos', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeAdvqhXiwHEKCvAO', false, 'Utilizador');

-- Insert sample tasks
INSERT INTO tasks (name, description, end_date, completed, user_id, type_id, created_by) VALUES 
('Implementar API REST', 'Desenvolvimento da API para gestão de tarefas', '2025-07-15', false, 2, 1, 1),
('Revisar documentação', 'Análise e revisão da documentação técnica', '2025-07-10', true, 3, 2, 1),
('Teste de integração', 'Testes de integração entre frontend e backend', '2025-07-20', false, 4, 3, 2);

-- Create views for common queries
CREATE VIEW active_users AS
SELECT id, name, username, role, created_at
FROM users 
WHERE active = true;

CREATE VIEW pending_tasks AS
SELECT t.id, t.name, t.description, t.end_date, u.name as user_name, tt.name as type_name
FROM tasks t
JOIN users u ON t.user_id = u.id
LEFT JOIN task_types tt ON t.type_id = tt.id
WHERE t.completed = false;

CREATE VIEW completed_tasks AS
SELECT t.id, t.name, t.description, t.end_date, u.name as user_name, tt.name as type_name
FROM tasks t
JOIN users u ON t.user_id = u.id
LEFT JOIN task_types tt ON t.type_id = tt.id
WHERE t.completed = true;