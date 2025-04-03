-- Script para garantir acesso total à tabela cities
-- Isso permite que todos os usuários autenticados vejam, editem e excluam todas as cidades

-- Remover políticas existentes para a tabela cities
DROP POLICY IF EXISTS cities_policy ON cities;
DROP POLICY IF EXISTS cities_insert_policy ON cities;
DROP POLICY IF EXISTS cities_update_policy ON cities;
DROP POLICY IF EXISTS cities_delete_policy ON cities;

-- Criar novas políticas sem restrições (usando TRUE para garantir acesso total)
-- Política para seleção (SELECT) - permite ver todos os registros
CREATE POLICY cities_policy ON cities 
  FOR SELECT USING (true);
  
-- Política para inserção (INSERT) - permite inserir novos registros
CREATE POLICY cities_insert_policy ON cities 
  FOR INSERT WITH CHECK (true);
  
-- Política para atualização (UPDATE) - permite atualizar qualquer registro
CREATE POLICY cities_update_policy ON cities 
  FOR UPDATE USING (true);
  
-- Política para exclusão (DELETE) - permite excluir qualquer registro
CREATE POLICY cities_delete_policy ON cities 
  FOR DELETE USING (true);

-- Verificar se a RLS (Row Level Security) está habilitada
ALTER TABLE IF EXISTS cities ENABLE ROW LEVEL SECURITY;

-- Mensagem de confirmação
DO $$
BEGIN
  RAISE NOTICE 'Políticas de acesso total para a tabela cities configuradas com sucesso!';
END
$$; 