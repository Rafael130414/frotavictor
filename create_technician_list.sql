-- Criar tabela de gerenciamento de técnicos
CREATE TABLE IF NOT EXISTS technician_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS (Row Level Security)
ALTER TABLE technician_list ENABLE ROW LEVEL SECURITY;

-- Criar política para restringir acesso aos dados do próprio usuário
CREATE POLICY technician_list_policy ON technician_list
  USING (auth.uid() = user_id);

-- Criar índice para otimizar consultas por user_id
CREATE INDEX IF NOT EXISTS idx_technician_list_user_id ON technician_list(user_id);

-- Criar função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar o timestamp de updated_at
CREATE TRIGGER update_technician_list_updated_at
  BEFORE UPDATE ON technician_list
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column(); 