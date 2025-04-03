-- Script para garantir que existe pelo menos uma configuração padrão na tabela technician_configs
-- Isso garante que o aplicativo sempre terá um valor de referência para os cálculos de relatórios

-- Verificar se existe algum registro na tabela technician_configs
DO $$
DECLARE
  record_count INTEGER;
BEGIN
  -- Contar registros existentes
  SELECT COUNT(*) INTO record_count FROM technician_configs;
  
  -- Se não existir nenhum registro, inserir a configuração padrão
  IF record_count = 0 THEN
    INSERT INTO technician_configs (user_id, service_order_value, created_at, updated_at)
    VALUES 
      (
        -- Usar o super admin como proprietário padrão
        (SELECT id FROM auth.users WHERE email = 'rafael.rodrigues@mixtel.com.br' LIMIT 1),
        150, -- valor padrão para ordem de serviço
        NOW(),
        NOW()
      );
      
    RAISE NOTICE 'Configuração padrão inserida com sucesso!';
  ELSE
    RAISE NOTICE 'Já existem % configurações na tabela. Nenhuma ação necessária.', record_count;
  END IF;
END
$$; 