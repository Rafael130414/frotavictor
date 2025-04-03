-- Script para adicionar políticas às tabelas relacionadas a Gastos e Ordens de Serviço
-- Permite que todos os usuários autenticados acessem os mesmos dados

-- Estas são tabelas adicionais relacionadas a gastos e ordens de serviço
-- Se alguma não existir, o erro pode ser ignorado

-- Remover políticas existentes
DROP POLICY IF EXISTS technician_expenses_policy ON technician_expenses;
DROP POLICY IF EXISTS technician_expenses_insert_policy ON technician_expenses;
DROP POLICY IF EXISTS technician_expenses_update_policy ON technician_expenses;
DROP POLICY IF EXISTS technician_expenses_delete_policy ON technician_expenses;

DROP POLICY IF EXISTS service_orders_policy ON service_orders;
DROP POLICY IF EXISTS service_orders_insert_policy ON service_orders;
DROP POLICY IF EXISTS service_orders_update_policy ON service_orders;
DROP POLICY IF EXISTS service_orders_delete_policy ON service_orders;

DROP POLICY IF EXISTS technician_monthly_reports_policy ON technician_monthly_reports;
DROP POLICY IF EXISTS technician_monthly_reports_insert_policy ON technician_monthly_reports;
DROP POLICY IF EXISTS technician_monthly_reports_update_policy ON technician_monthly_reports;
DROP POLICY IF EXISTS technician_monthly_reports_delete_policy ON technician_monthly_reports;

-- Criar políticas para visualização
CREATE POLICY technician_expenses_policy ON technician_expenses
  USING (auth.role() = 'authenticated');
  
CREATE POLICY service_orders_policy ON service_orders
  USING (auth.role() = 'authenticated');
  
CREATE POLICY technician_monthly_reports_policy ON technician_monthly_reports
  USING (auth.role() = 'authenticated');

-- Criar políticas para inserção
CREATE POLICY technician_expenses_insert_policy ON technician_expenses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  
CREATE POLICY service_orders_insert_policy ON service_orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  
CREATE POLICY technician_monthly_reports_insert_policy ON technician_monthly_reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Criar políticas para atualização
CREATE POLICY technician_expenses_update_policy ON technician_expenses
  FOR UPDATE USING (auth.role() = 'authenticated');
  
CREATE POLICY service_orders_update_policy ON service_orders
  FOR UPDATE USING (auth.role() = 'authenticated');
  
CREATE POLICY technician_monthly_reports_update_policy ON technician_monthly_reports
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Criar políticas para exclusão
CREATE POLICY technician_expenses_delete_policy ON technician_expenses
  FOR DELETE USING (auth.role() = 'authenticated');
  
CREATE POLICY service_orders_delete_policy ON service_orders
  FOR DELETE USING (auth.role() = 'authenticated');
  
CREATE POLICY technician_monthly_reports_delete_policy ON technician_monthly_reports
  FOR DELETE USING (auth.role() = 'authenticated'); 