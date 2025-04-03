-- Script para garantir acesso total à tabela technician_list
-- Isso permite que todos os usuários autenticados vejam, editem e excluam todos os técnicos

-- Remover políticas existentes para a tabela technician_list
DROP POLICY IF EXISTS technician_list_policy ON technician_list;
DROP POLICY IF EXISTS technician_list_insert_policy ON technician_list;
DROP POLICY IF EXISTS technician_list_update_policy ON technician_list;
DROP POLICY IF EXISTS technician_list_delete_policy ON technician_list;

-- Criar novas políticas sem restrições (usando TRUE para garantir acesso total)
-- Política para seleção (SELECT) - permite ver todos os registros
CREATE POLICY technician_list_policy ON technician_list 
  FOR SELECT USING (true);
  
-- Política para inserção (INSERT) - permite inserir novos registros
CREATE POLICY technician_list_insert_policy ON technician_list 
  FOR INSERT WITH CHECK (true);
  
-- Política para atualização (UPDATE) - permite atualizar qualquer registro
CREATE POLICY technician_list_update_policy ON technician_list 
  FOR UPDATE USING (true);
  
-- Política para exclusão (DELETE) - permite excluir qualquer registro
CREATE POLICY technician_list_delete_policy ON technician_list 
  FOR DELETE USING (true);

-- Verificar se a RLS (Row Level Security) está habilitada
ALTER TABLE IF EXISTS technician_list ENABLE ROW LEVEL SECURITY;

-- Mensagem de confirmação
DO $$
BEGIN
  RAISE NOTICE 'Políticas de acesso total para a tabela technician_list configuradas com sucesso!';
END
$$; 