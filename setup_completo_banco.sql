-- Script completo de criação do banco de dados
-- Este script deve ser executado com privilégios de superusuário

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Função auxiliar para atualizar timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Configuração de Usuários e Autenticação
--------------------------------------------------------------------------------

-- Criar tabela de usuários do sistema
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Criar tabela de papéis de usuário
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'admin', 'regular', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Ativar RLS para tabela de papéis
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Configuração de Técnicos
--------------------------------------------------------------------------------

-- Criar tabela de gerenciamento de técnicos
CREATE TABLE IF NOT EXISTS technician_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS para tabela de técnicos
ALTER TABLE technician_list ENABLE ROW LEVEL SECURITY;

-- Criar tabela de configurações de técnicos
CREATE TABLE IF NOT EXISTS technician_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  technician_id UUID NOT NULL REFERENCES technician_list(id) ON DELETE CASCADE,
  config_key TEXT NOT NULL,
  config_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (technician_id, config_key)
);

-- Ativar RLS para configurações de técnicos
ALTER TABLE technician_configs ENABLE ROW LEVEL SECURITY;

-- 3. Configuração de Cidades
--------------------------------------------------------------------------------

-- Criar tabela de cidades
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS para tabela de cidades
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- 4. Configuração de Ordens de Serviço
--------------------------------------------------------------------------------

-- Criar tabela de ordens de serviço
CREATE TABLE IF NOT EXISTS service_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  technician_id UUID NOT NULL REFERENCES technician_list(id),
  city_id UUID NOT NULL REFERENCES cities(id),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS para ordens de serviço
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;

-- Criar tabela de gastos das ordens de serviço
CREATE TABLE IF NOT EXISTS service_order_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS para gastos
ALTER TABLE service_order_expenses ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Segurança (RLS)
--------------------------------------------------------------------------------

-- Políticas para usuários
CREATE POLICY users_view_policy ON users 
  USING (
    (auth.uid() = id) 
    OR 
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Políticas para papéis de usuário
CREATE POLICY user_roles_view_policy ON user_roles
  USING (
    (auth.uid() = user_id) 
    OR 
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY user_roles_modify_policy ON user_roles
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Políticas para técnicos
CREATE POLICY technician_list_policy ON technician_list
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Políticas para configurações de técnicos
CREATE POLICY technician_configs_policy ON technician_configs
  USING (
    EXISTS (
      SELECT 1 FROM technician_list
      WHERE id = technician_configs.technician_id
      AND (
        user_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_id = auth.uid() 
          AND role = 'admin'
        )
      )
    )
  );

-- Políticas para cidades
CREATE POLICY cities_policy ON cities
  USING (true)
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Políticas para ordens de serviço
CREATE POLICY service_orders_policy ON service_orders
  USING (
    created_by = auth.uid()
    OR
    technician_id IN (
      SELECT id FROM technician_list WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Políticas para gastos
CREATE POLICY service_order_expenses_policy ON service_order_expenses
  USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM service_orders
      WHERE id = service_order_expenses.service_order_id
      AND (
        created_by = auth.uid()
        OR
        technician_id IN (
          SELECT id FROM technician_list WHERE user_id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_id = auth.uid() 
          AND role = 'admin'
        )
      )
    )
  );

-- 6. Triggers e Funções
--------------------------------------------------------------------------------

-- Trigger para novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers para atualização de timestamps
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_technician_list_updated_at
  BEFORE UPDATE ON technician_list
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_technician_configs_updated_at
  BEFORE UPDATE ON technician_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_cities_updated_at
  BEFORE UPDATE ON cities
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_service_orders_updated_at
  BEFORE UPDATE ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_service_order_expenses_updated_at
  BEFORE UPDATE ON service_order_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- 7. Índices
--------------------------------------------------------------------------------

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_technician_list_user_id ON technician_list(user_id);
CREATE INDEX IF NOT EXISTS idx_technician_configs_technician_id ON technician_configs(technician_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_technician_id ON service_orders(technician_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_city_id ON service_orders(city_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_created_by ON service_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_service_order_expenses_service_order_id ON service_order_expenses(service_order_id);
CREATE INDEX IF NOT EXISTS idx_service_order_expenses_created_by ON service_order_expenses(created_by);

-- 8. Dados Iniciais (se necessário)
--------------------------------------------------------------------------------

-- Inserir administrador inicial (substitua o email conforme necessário)
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users
WHERE email = 'rafael.rodrigues@mixtel.com.br'
ON CONFLICT (user_id, role) DO NOTHING;

-- Fim do script 