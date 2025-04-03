-- Script corrigido para adicionar políticas às tabelas relacionadas a Gastos e Ordens de Serviço
-- Permite que todos os usuários autenticados acessem os mesmos dados

-- A tabela principal do módulo "Gastos e Ordens de Serviço" é technicians 
-- (já incluída no script anterior)

-- Vamos remover políticas e adicionar novas para a tabela principal technicians
DROP POLICY IF EXISTS technicians_policy ON technicians;
DROP POLICY IF EXISTS technicians_insert_policy ON technicians;
DROP POLICY IF EXISTS technicians_update_policy ON technicians;
DROP POLICY IF EXISTS technicians_delete_policy ON technicians;

-- Criar políticas para visualização
CREATE POLICY technicians_policy ON technicians
  USING (auth.role() = 'authenticated');

-- Criar políticas para inserção
CREATE POLICY technicians_insert_policy ON technicians
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Criar políticas para atualização
CREATE POLICY technicians_update_policy ON technicians
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Criar políticas para exclusão
CREATE POLICY technicians_delete_policy ON technicians
  FOR DELETE USING (auth.role() = 'authenticated'); 