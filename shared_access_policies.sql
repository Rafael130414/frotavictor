-- Script para modificar as políticas de segurança (RLS)
-- Este script permitirá que todos os usuários autenticados acessem os mesmos dados

-- Remover políticas existentes para a tabela cars
DROP POLICY IF EXISTS cars_policy ON cars;
DROP POLICY IF EXISTS cars_insert_policy ON cars;
DROP POLICY IF EXISTS cars_update_policy ON cars;
DROP POLICY IF EXISTS cars_delete_policy ON cars;

-- Remover políticas existentes para a tabela fuel_entries
DROP POLICY IF EXISTS fuel_entries_policy ON fuel_entries;
DROP POLICY IF EXISTS fuel_entries_insert_policy ON fuel_entries;
DROP POLICY IF EXISTS fuel_entries_update_policy ON fuel_entries;
DROP POLICY IF EXISTS fuel_entries_delete_policy ON fuel_entries;

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

-- Criar novas políticas para visualização
CREATE POLICY cars_policy ON cars
  USING (auth.role() = 'authenticated');

CREATE POLICY fuel_entries_policy ON fuel_entries
  USING (auth.role() = 'authenticated');

CREATE POLICY technicians_policy ON technicians
  USING (auth.role() = 'authenticated');

CREATE POLICY cities_policy ON cities
  USING (auth.role() = 'authenticated');

CREATE POLICY technician_configs_policy ON technician_configs
  USING (auth.role() = 'authenticated');

CREATE POLICY technician_list_policy ON technician_list
  USING (auth.role() = 'authenticated');

-- Criar políticas para inserção
CREATE POLICY cars_insert_policy ON cars
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY fuel_entries_insert_policy ON fuel_entries
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY technicians_insert_policy ON technicians
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY cities_insert_policy ON cities
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY technician_configs_insert_policy ON technician_configs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY technician_list_insert_policy ON technician_list
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Criar políticas para atualização
CREATE POLICY cars_update_policy ON cars
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY fuel_entries_update_policy ON fuel_entries
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY technicians_update_policy ON technicians
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY cities_update_policy ON cities
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY technician_configs_update_policy ON technician_configs
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY technician_list_update_policy ON technician_list
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Criar políticas para exclusão
CREATE POLICY cars_delete_policy ON cars
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY fuel_entries_delete_policy ON fuel_entries
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY technicians_delete_policy ON technicians
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY cities_delete_policy ON cities
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY technician_configs_delete_policy ON technician_configs
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY technician_list_delete_policy ON technician_list
  FOR DELETE USING (auth.role() = 'authenticated'); 