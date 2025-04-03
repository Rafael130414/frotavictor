-- Criação da tabela de cidades
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criação da tabela de técnicos
CREATE TABLE IF NOT EXISTS technicians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city_id UUID REFERENCES cities(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  food_expense DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fuel_expense DECIMAL(10, 2) NOT NULL DEFAULT 0,
  other_expense DECIMAL(10, 2) NOT NULL DEFAULT 0,
  accommodation_expense DECIMAL(10, 2) NOT NULL DEFAULT 0,
  service_orders INTEGER NOT NULL DEFAULT 0,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criação da tabela de configurações
CREATE TABLE IF NOT EXISTS technician_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_order_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_config UNIQUE (user_id)
);

-- Configuração de políticas de segurança (RLS) para cidades
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY cities_select_policy ON cities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY cities_insert_policy ON cities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY cities_update_policy ON cities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY cities_delete_policy ON cities
  FOR DELETE USING (auth.uid() = user_id);

-- Configuração de políticas de segurança (RLS) para técnicos
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY technicians_select_policy ON technicians
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY technicians_insert_policy ON technicians
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY technicians_update_policy ON technicians
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY technicians_delete_policy ON technicians
  FOR DELETE USING (auth.uid() = user_id);

-- Configuração de políticas de segurança (RLS) para configurações
ALTER TABLE technician_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY technician_configs_select_policy ON technician_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY technician_configs_insert_policy ON technician_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY technician_configs_update_policy ON technician_configs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY technician_configs_delete_policy ON technician_configs
  FOR DELETE USING (auth.uid() = user_id);

-- Criar índices para melhorar a performance
CREATE INDEX technicians_user_id_idx ON technicians (user_id);
CREATE INDEX technicians_city_id_idx ON technicians (city_id);
CREATE INDEX technicians_date_idx ON technicians (date);
CREATE INDEX cities_user_id_idx ON cities (user_id);

-- Comentários para documentação
COMMENT ON TABLE cities IS 'Tabela para armazenar as cidades onde os técnicos realizam trabalhos';
COMMENT ON TABLE technicians IS 'Tabela para registro de despesas e ordens de serviço dos técnicos';
COMMENT ON TABLE technician_configs IS 'Tabela para configurações de valor da ordem de serviço';

-- Grant de acesso para o supabase service role
GRANT ALL ON cities TO service_role;
GRANT ALL ON technicians TO service_role;
GRANT ALL ON technician_configs TO service_role;