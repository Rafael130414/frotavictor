-- Script para verificar e corrigir a estrutura do banco de dados
-- e garantir a integridade das relações entre técnicos e cidades

-- 1. Verificar e adicionar restrição de chave estrangeira na tabela technicians se não existir
DO $$
BEGIN
  -- Verificar se a restrição de chave estrangeira existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'technicians_city_id_fkey' 
    AND table_name = 'technicians'
  ) THEN
    -- Adicionar restrição de chave estrangeira
    BEGIN
      ALTER TABLE technicians 
      ADD CONSTRAINT technicians_city_id_fkey 
      FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL;
      
      RAISE NOTICE 'Restrição de chave estrangeira adicionada na tabela technicians';
    EXCEPTION
      WHEN others THEN
        RAISE NOTICE 'Erro ao adicionar restrição de chave estrangeira: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Restrição de chave estrangeira já existe na tabela technicians';
  END IF;
END
$$;

-- 2. Verificar e corrigir registros onde city_id é nulo ou inválido
DO $$
DECLARE
  default_city_id uuid;
  orphan_count INTEGER;
BEGIN
  -- Verificar se temos cidades sem registros
  SELECT COUNT(*) INTO orphan_count 
  FROM technicians 
  WHERE city_id IS NULL OR 
        NOT EXISTS (SELECT 1 FROM cities WHERE cities.id = technicians.city_id);
  
  IF orphan_count > 0 THEN
    -- Tentar encontrar uma cidade padrão
    SELECT id INTO default_city_id FROM cities LIMIT 1;
    
    IF default_city_id IS NOT NULL THEN
      -- Atualizar registros com city_id inválido para usar a cidade padrão
      UPDATE technicians
      SET city_id = default_city_id
      WHERE city_id IS NULL OR 
            NOT EXISTS (SELECT 1 FROM cities WHERE cities.id = technicians.city_id);
      
      RAISE NOTICE 'Atualizados % registros de técnicos com cidade inválida', orphan_count;
    ELSE
      RAISE NOTICE 'Não foi possível corrigir registros órfãos. Não há cidade padrão disponível.';
    END IF;
  ELSE
    RAISE NOTICE 'Não há registros de técnicos com cidades inválidas.';
  END IF;
END
$$;

-- 3. Garantir que todas as tabelas principais tenham índices apropriados
DO $$
BEGIN
  -- Adicionar índice para city_id em technicians se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'technicians' AND indexname = 'idx_technicians_city_id'
  ) THEN
    CREATE INDEX idx_technicians_city_id ON technicians(city_id);
    RAISE NOTICE 'Índice criado para city_id na tabela technicians';
  ELSE
    RAISE NOTICE 'Índice para city_id já existe na tabela technicians';
  END IF;
END
$$;

-- Mensagem de confirmação
RAISE NOTICE 'Script de correção de estrutura do banco de dados concluído.'; 