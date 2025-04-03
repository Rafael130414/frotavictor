-- Script para corrigir as políticas de segurança da tabela users

-- Remover políticas existentes que possam estar restringindo acesso
DROP POLICY IF EXISTS users_view_policy ON users;

-- Criar uma política que permite a todos os usuários autenticados visualizar todos os usuários
CREATE POLICY users_view_policy ON users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Criar política para permitir inserção apenas do próprio registro
CREATE POLICY users_insert_policy ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Criar política para permitir atualização apenas do próprio registro
CREATE POLICY users_update_policy ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Verificar as políticas
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users'; 