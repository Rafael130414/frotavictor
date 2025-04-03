-- Script para garantir acesso total a todas as tabelas principais do sistema
-- Isso permite que todos os usuários autenticados vejam, editem e excluam todos os registros de todas as tabelas

--------------------------------
-- TABELA: cities (cidades)
--------------------------------
-- Remover políticas existentes
DROP POLICY IF EXISTS cities_policy ON cities;
DROP POLICY IF EXISTS cities_insert_policy ON cities;
DROP POLICY IF EXISTS cities_update_policy ON cities;
DROP POLICY IF EXISTS cities_delete_policy ON cities;

-- Criar novas políticas sem restrições
CREATE POLICY cities_policy ON cities FOR SELECT USING (true);
CREATE POLICY cities_insert_policy ON cities FOR INSERT WITH CHECK (true);
CREATE POLICY cities_update_policy ON cities FOR UPDATE USING (true);
CREATE POLICY cities_delete_policy ON cities FOR DELETE USING (true);

--------------------------------
-- TABELA: technician_list (lista de técnicos)
--------------------------------
-- Remover políticas existentes
DROP POLICY IF EXISTS technician_list_policy ON technician_list;
DROP POLICY IF EXISTS technician_list_insert_policy ON technician_list;
DROP POLICY IF EXISTS technician_list_update_policy ON technician_list;
DROP POLICY IF EXISTS technician_list_delete_policy ON technician_list;

-- Criar novas políticas sem restrições
CREATE POLICY technician_list_policy ON technician_list FOR SELECT USING (true);
CREATE POLICY technician_list_insert_policy ON technician_list FOR INSERT WITH CHECK (true);
CREATE POLICY technician_list_update_policy ON technician_list FOR UPDATE USING (true);
CREATE POLICY technician_list_delete_policy ON technician_list FOR DELETE USING (true);

--------------------------------
-- TABELA: technicians (registros de técnicos)
--------------------------------
-- Remover políticas existentes
DROP POLICY IF EXISTS technicians_policy ON technicians;
DROP POLICY IF EXISTS technicians_insert_policy ON technicians;
DROP POLICY IF EXISTS technicians_update_policy ON technicians;
DROP POLICY IF EXISTS technicians_delete_policy ON technicians;

-- Criar novas políticas sem restrições
CREATE POLICY technicians_policy ON technicians FOR SELECT USING (true);
CREATE POLICY technicians_insert_policy ON technicians FOR INSERT WITH CHECK (true);
CREATE POLICY technicians_update_policy ON technicians FOR UPDATE USING (true);
CREATE POLICY technicians_delete_policy ON technicians FOR DELETE USING (true);

--------------------------------
-- TABELA: technician_configs (configurações)
--------------------------------
-- Remover políticas existentes
DROP POLICY IF EXISTS technician_configs_policy ON technician_configs;
DROP POLICY IF EXISTS technician_configs_insert_policy ON technician_configs;
DROP POLICY IF EXISTS technician_configs_update_policy ON technician_configs;
DROP POLICY IF EXISTS technician_configs_delete_policy ON technician_configs;

-- Criar novas políticas sem restrições
CREATE POLICY technician_configs_policy ON technician_configs FOR SELECT USING (true);
CREATE POLICY technician_configs_insert_policy ON technician_configs FOR INSERT WITH CHECK (true);
CREATE POLICY technician_configs_update_policy ON technician_configs FOR UPDATE USING (true);
CREATE POLICY technician_configs_delete_policy ON technician_configs FOR DELETE USING (true);

-- Verificar se a RLS (Row Level Security) está habilitada para todas as tabelas
ALTER TABLE IF EXISTS cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS technician_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS technician_configs ENABLE ROW LEVEL SECURITY;

-- Mensagem de confirmação
DO $$
BEGIN
  RAISE NOTICE 'Políticas de acesso total para todas as tabelas configuradas com sucesso!';
END
$$; 