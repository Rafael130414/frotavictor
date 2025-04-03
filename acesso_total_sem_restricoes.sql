-- Script para remover todas as restrições de acesso nas tabelas principais
-- Isso permite que todos os usuários autenticados vejam, editem e excluam todos os dados

-- Remover políticas existentes para a tabela technicians
DROP POLICY IF EXISTS technicians_policy ON technicians;
DROP POLICY IF EXISTS technicians_insert_policy ON technicians;
DROP POLICY IF EXISTS technicians_update_policy ON technicians;
DROP POLICY IF EXISTS technicians_delete_policy ON technicians;

-- Remover políticas existentes para a tabela cities
DROP POLICY IF EXISTS cities_policy ON cities;
DROP POLICY IF EXISTS cities_insert_policy ON cities;
DROP POLICY IF EXISTS cities_update_policy ON cities;
DROP POLICY IF EXISTS cities_delete_policy ON cities;

-- Remover políticas existentes para a tabela technician_configs
DROP POLICY IF EXISTS technician_configs_policy ON technician_configs;
DROP POLICY IF EXISTS technician_configs_insert_policy ON technician_configs;
DROP POLICY IF EXISTS technician_configs_update_policy ON technician_configs;
DROP POLICY IF EXISTS technician_configs_delete_policy ON technician_configs;

-- Remover políticas existentes para a tabela technician_list
DROP POLICY IF EXISTS technician_list_policy ON technician_list;
DROP POLICY IF EXISTS technician_list_insert_policy ON technician_list;
DROP POLICY IF EXISTS technician_list_update_policy ON technician_list;
DROP POLICY IF EXISTS technician_list_delete_policy ON technician_list;

-- Criar novas políticas - USANDO SIMPLESMENTE 'true' PARA ACESSO TOTAL
-- Isso vai garantir que não haja nenhuma restrição

-- Políticas para technicians
CREATE POLICY technicians_policy ON technicians 
  FOR SELECT USING (true);
  
CREATE POLICY technicians_insert_policy ON technicians 
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY technicians_update_policy ON technicians 
  FOR UPDATE USING (true);
  
CREATE POLICY technicians_delete_policy ON technicians 
  FOR DELETE USING (true);
  
-- Políticas para cities
CREATE POLICY cities_policy ON cities 
  FOR SELECT USING (true);
  
CREATE POLICY cities_insert_policy ON cities 
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY cities_update_policy ON cities 
  FOR UPDATE USING (true);
  
CREATE POLICY cities_delete_policy ON cities 
  FOR DELETE USING (true);
  
-- Políticas para technician_configs
CREATE POLICY technician_configs_policy ON technician_configs 
  FOR SELECT USING (true);
  
CREATE POLICY technician_configs_insert_policy ON technician_configs 
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY technician_configs_update_policy ON technician_configs 
  FOR UPDATE USING (true);
  
CREATE POLICY technician_configs_delete_policy ON technician_configs 
  FOR DELETE USING (true);
  
-- Políticas para technician_list
CREATE POLICY technician_list_policy ON technician_list 
  FOR SELECT USING (true);
  
CREATE POLICY technician_list_insert_policy ON technician_list 
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY technician_list_update_policy ON technician_list 
  FOR UPDATE USING (true);
  
CREATE POLICY technician_list_delete_policy ON technician_list 
  FOR DELETE USING (true); 