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
-- Hash gerado com bcrypt rounds=12 para 'admin123'
INSERT INTO users (name, username, password, active, role) VALUES 
('Administrador', 'admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeAdvqhXiwHEKCvAO', true, 'Administrador')
ON DUPLICATE KEY UPDATE 
password = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeAdvqhXiwHEKCvAO',
active = true;

-- Insert sample task types
INSERT INTO task_types (name) VALUES 
('Desenvolvimento'),
('Análise'),
('Teste'),
('Documentação'),
('Reunião'),
('Design'),
('Marketing'),
('Suporte')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insert sample users (password: 123456 for all)
-- Hash gerado com bcrypt rounds=12 para '123456'
INSERT INTO users (name, username, password, active, role) VALUES 
('João Silva', 'jsilva', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, 'Utilizador'),
('Ana Costa', 'acosta', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, 'Gestor'),
('Pedro Santos', 'psantos', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, 'Utilizador'),
('Maria Oliveira', 'moliveira', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, 'Utilizador'),
('Carlos Ferreira', 'cferreira', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', false, 'Utilizador'),
('Rita Mendes', 'rmendes', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, 'Gestor'),
('Paulo Rodrigues', 'prodrigues', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, 'Utilizador'),
('Sofia Almeida', 'salmeida', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', false, 'Utilizador')
ON DUPLICATE KEY UPDATE 
password = VALUES(password),
active = VALUES(active),
role = VALUES(role);

-- Insert sample tasks with future dates
INSERT INTO tasks (name, description, end_date, completed, user_id, type_id, created_by) VALUES 
('Implementar API REST', 'Desenvolvimento da API para gestão de tarefas com autenticação e validação', '2025-08-15', false, 2, 1, 1),
('Revisar documentação técnica', 'Análise e revisão completa da documentação do sistema', '2025-07-25', false, 3, 2, 1),
('Testes de integração', 'Execução de testes completos entre frontend e backend', '2025-08-10', false, 4, 3, 2),
('Design da interface', 'Criação de mockups e protótipos para nova funcionalidade', '2025-07-30', true, 5, 6, 2),
('Reunião de planeamento', 'Reunião semanal para definir prioridades do sprint', '2025-07-02', false, 2, 5, 1),
('Suporte ao cliente', 'Resolver tickets pendentes do sistema de suporte', '2025-07-05', false, 7, 8, 3),
('Campanha de marketing', 'Criar conteúdo para redes sociais e newsletter', '2025-08-20', false, 3, 7, 3),
('Backup da base de dados', 'Configurar sistema de backup automático', '2025-07-15', true, 7, 1, 1),
('Análise de performance', 'Estudar métricas de performance da aplicação', '2025-07-12', false, 4, 2, 2),
('Documentar API', 'Criar documentação detalhada dos endpoints', '2025-08-05', false, 2, 4, 1),
('Teste de segurança', 'Auditoria de segurança do sistema', '2025-07-28', false, 5, 3, 3),
('Reunião com stakeholders', 'Apresentação do progresso do projeto', '2025-07-08', false, 3, 5, 1)
ON DUPLICATE KEY UPDATE 
name = VALUES(name),
description = VALUES(description),
end_date = VALUES(end_date),
completed = VALUES(completed);

-- Create views for common queries
CREATE OR REPLACE VIEW active_users AS
SELECT id, name, username, role, created_at
FROM users 
WHERE active = true;

CREATE OR REPLACE VIEW pending_tasks AS
SELECT t.id, t.name, t.description, t.end_date, u.name as user_name, tt.name as type_name
FROM tasks t
JOIN users u ON t.user_id = u.id
LEFT JOIN task_types tt ON t.type_id = tt.id
WHERE t.completed = false;

CREATE OR REPLACE VIEW completed_tasks AS
SELECT t.id, t.name, t.description, t.end_date, u.name as user_name, tt.name as type_name
FROM tasks t
JOIN users u ON t.user_id = u.id
LEFT JOIN task_types tt ON t.type_id = tt.id
WHERE t.completed = true;

-- Create a view for user credentials (for demo purposes)
CREATE OR REPLACE VIEW user_credentials AS
SELECT 
    id,
    name,
    username,
    CASE 
        WHEN username = 'admin' THEN 'admin123'
        ELSE '123456'
    END as demo_password,
    active,
    role,
    created_at
FROM users
ORDER BY role DESC, name;