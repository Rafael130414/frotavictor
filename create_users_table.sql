-- Criar tabela de usuários do sistema
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Criar tabela de papéis de usuário (admin, regular, etc)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'admin', 'regular', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Ativar RLS para tabela de papéis
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Conceder o primeiro usuário (rafael.rodrigues@mixtel.com.br) como administrador
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users
WHERE email = 'rafael.rodrigues@mixtel.com.br'
ON CONFLICT (user_id, role) DO NOTHING;

-- Criar política para visualização (apenas admin pode ver todos os usuários)
CREATE POLICY users_view_policy ON users 
  USING (
    -- Usuários normais só veem seu próprio registro
    (auth.uid() = id) 
    OR 
    -- Administradores podem ver todos os registros
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Política para visualizar papéis
CREATE POLICY user_roles_view_policy ON user_roles
  USING (
    -- Usuários normais só veem seu próprio papel
    (auth.uid() = user_id) 
    OR 
    -- Administradores podem ver todos os papéis
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Política para modificar papéis (apenas admin)
CREATE POLICY user_roles_modify_policy ON user_roles
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Criar função trigger para adicionar automaticamente um registro na tabela users
-- quando um novo usuário for criado no auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger que dispara quando um novo usuário é criado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 