-- Script para garantir acesso total à tabela technician_configs
-- Isso permite que todos os usuários autenticados vejam, editem e excluam todos os registros de configurações

-- Remover políticas existentes para a tabela technician_configs
DROP POLICY IF EXISTS technician_configs_policy ON technician_configs;
DROP POLICY IF EXISTS technician_configs_insert_policy ON technician_configs;
DROP POLICY IF EXISTS technician_configs_update_policy ON technician_configs;
DROP POLICY IF EXISTS technician_configs_delete_policy ON technician_configs;

-- Criar novas políticas sem restrições (usando TRUE para garantir acesso total)
-- Política para seleção (SELECT) - permite ver todos os registros
CREATE POLICY technician_configs_policy ON technician_configs 
  FOR SELECT USING (true);
  
-- Política para inserção (INSERT) - permite inserir novos registros
CREATE POLICY technician_configs_insert_policy ON technician_configs 
  FOR INSERT WITH CHECK (true);
  
-- Política para atualização (UPDATE) - permite atualizar qualquer registro
CREATE POLICY technician_configs_update_policy ON technician_configs 
  FOR UPDATE USING (true);
  
-- Política para exclusão (DELETE) - permite excluir qualquer registro
CREATE POLICY technician_configs_delete_policy ON technician_configs 
  FOR DELETE USING (true);

-- Verificar se a RLS (Row Level Security) está habilitada
ALTER TABLE IF EXISTS technician_configs ENABLE ROW LEVEL SECURITY;

-- Mensagem de confirmação
DO $$
BEGIN
  RAISE NOTICE 'Políticas de acesso total para a tabela technician_configs configuradas com sucesso!';
END
$$; 