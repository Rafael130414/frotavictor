-- Script para garantir acesso total à tabela technicians
-- Isso permite que todos os usuários autenticados vejam, editem e excluam todos os registros de técnicos

-- Remover políticas existentes para a tabela technicians
DROP POLICY IF EXISTS technicians_policy ON technicians;
DROP POLICY IF EXISTS technicians_insert_policy ON technicians;
DROP POLICY IF EXISTS technicians_update_policy ON technicians;
DROP POLICY IF EXISTS technicians_delete_policy ON technicians;

-- Criar novas políticas sem restrições (usando TRUE para garantir acesso total)
-- Política para seleção (SELECT) - permite ver todos os registros
CREATE POLICY technicians_policy ON technicians 
  FOR SELECT USING (true);
  
-- Política para inserção (INSERT) - permite inserir novos registros
CREATE POLICY technicians_insert_policy ON technicians 
  FOR INSERT WITH CHECK (true);
  
-- Política para atualização (UPDATE) - permite atualizar qualquer registro
CREATE POLICY technicians_update_policy ON technicians 
  FOR UPDATE USING (true);
  
-- Política para exclusão (DELETE) - permite excluir qualquer registro
CREATE POLICY technicians_delete_policy ON technicians 
  FOR DELETE USING (true);

-- Verificar se a RLS (Row Level Security) está habilitada
ALTER TABLE IF EXISTS technicians ENABLE ROW LEVEL SECURITY;

-- Mensagem de confirmação
DO $$
BEGIN
  RAISE NOTICE 'Políticas de acesso total para a tabela technicians configuradas com sucesso!';
END
$$; 