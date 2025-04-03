-- Função para listar todos os usuários (apenas para administradores)
CREATE OR REPLACE FUNCTION list_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário é administrador
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem listar usuários';
  END IF;

  RETURN QUERY
  SELECT u.id, u.email, u.created_at
  FROM users u
  ORDER BY u.created_at DESC;
END;
$$;

-- Função para criar um novo usuário (apenas para administradores)
CREATE OR REPLACE FUNCTION create_user(user_email TEXT, user_password TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  result JSON;
BEGIN
  -- Verificar se o usuário é administrador
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem criar usuários';
  END IF;

  -- Verificar se o email já existe
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = user_email
  ) THEN
    RAISE EXCEPTION 'Email já registrado';
  END IF;

  -- Criar o usuário usando a API interna do Supabase
  -- Obs: isso exige uma função anônima SQL com permissões elevadas
  SELECT id INTO new_user_id FROM auth.users WHERE email = user_email;
  
  IF new_user_id IS NULL THEN
    -- Não podemos criar o usuário diretamente pelo SQL, vamos retornar um erro mais informativo
    RAISE EXCEPTION 'Não foi possível criar o usuário automaticamente. Use o painel administrativo do Supabase para adicionar usuários ou crie uma função serverless para essa função.';
  END IF;

  -- Adicionar o usuário como regular (não admin)
  INSERT INTO user_roles (user_id, role)
  VALUES (new_user_id, 'regular')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Retornar informações do usuário criado
  SELECT json_build_object(
    'id', u.id,
    'email', u.email,
    'created_at', u.created_at
  ) INTO result
  FROM users u
  WHERE u.id = new_user_id;

  RETURN result;
END;
$$;

-- Função para excluir um usuário (apenas para administradores)
CREATE OR REPLACE FUNCTION delete_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário é administrador
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem excluir usuários';
  END IF;

  -- Não permitir excluir a si mesmo
  IF user_id = auth.uid() THEN
    RAISE EXCEPTION 'Você não pode excluir sua própria conta';
  END IF;

  -- Nota: Não podemos deletar diretamente de auth.users através do SQL
  -- Vamos tentar desativar o usuário
  UPDATE auth.users
  SET disabled = true
  WHERE id = user_id;

  -- Remover registros associados
  DELETE FROM user_roles
  WHERE user_id = user_id;

  RETURN TRUE;
END;
$$;

-- Função para promover um usuário a administrador (apenas para administradores)
CREATE OR REPLACE FUNCTION promote_to_admin(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário é administrador
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem promover usuários';
  END IF;

  -- Adicionar o papel de admin
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN TRUE;
END;
$$;

-- Função para rebaixar um usuário de administrador (apenas para administradores)
CREATE OR REPLACE FUNCTION demote_from_admin(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário é administrador
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem rebaixar usuários';
  END IF;

  -- Não permitir rebaixar a si mesmo
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Você não pode rebaixar sua própria conta';
  END IF;

  -- Remover o papel de admin
  DELETE FROM user_roles
  WHERE user_id = target_user_id
  AND role = 'admin';

  -- Garantir que o usuário ainda tenha o papel regular
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, 'regular')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN TRUE;
END;
$$; 