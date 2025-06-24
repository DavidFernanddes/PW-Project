-- Script de Criação da Base de Dados para Sistema de Gestão de Tarefas
-- Projeto Fase 2 - Programação Web
-- Desenvolvido por: David Fernandes, João Rôlo, Sorin Revenco
-- APENAS ESTRUTURA - SEM DADOS

-- Criar base de dados
CREATE DATABASE IF NOT EXISTS gestao_tarefas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gestao_tarefas;

-- Eliminar tabelas existentes caso existam (para configuração limpa)
DROP TABLE IF EXISTS task_logs;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS task_types;
DROP TABLE IF EXISTS users;

-- Criar tabela de utilizadores
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

-- Criar tabela de tipos de tarefa
CREATE TABLE task_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Criar tabela de tarefas
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

-- Criar tabela de registos de tarefas para auditoria
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

-- Inserir tipos de tarefa por defeito
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

-- Criar vistas para consultas comuns
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

-- Criar uma vista para credenciais de utilizador (para demonstração)
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