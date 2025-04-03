-- Script para popular a tabela users com todos os usuários existentes no auth.users
-- Este script deve ser executado após criar a tabela users

-- Inserir todos os usuários existentes na tabela users 
-- (ignora duplicatas graças ao ON CONFLICT DO NOTHING)
INSERT INTO users (id, email, created_at, updated_at)
SELECT 
  id, 
  email, 
  created_at, 
  COALESCE(updated_at, created_at) as updated_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Verificar a quantidade de usuários inseridos
SELECT COUNT(*) as total_users FROM users; 