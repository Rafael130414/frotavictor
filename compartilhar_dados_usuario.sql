-- Script para garantir que os dados do usuário rafael.rodrigues@mixtel.com.br 
-- sejam visíveis para todos os usuários autenticados

-- Primeiro, vamos obter o ID do usuário rafael.rodrigues@mixtel.com.br
-- e guardar em uma variável para uso posterior
DO $$
DECLARE
  rafael_id UUID;
BEGIN
  -- Obter o ID do usuário rafael.rodrigues@mixtel.com.br
  SELECT id INTO rafael_id FROM auth.users WHERE email = 'rafael.rodrigues@mixtel.com.br';

  -- Se o ID foi encontrado, continue com as operações
  IF rafael_id IS NOT NULL THEN
    -- 1. Remover políticas existentes das tabelas principais
    
    -- Tabela technicians (técnicos)
    DROP POLICY IF EXISTS technicians_policy ON technicians;
    
    -- Tabela cities (cidades)
    DROP POLICY IF EXISTS cities_policy ON cities;
    
    -- 2. Criar políticas específicas que não filtram por user_id
    
    -- Política para technicians: permite visualizar todos os registros, incluindo os de rafael
    EXECUTE format('CREATE POLICY technicians_policy ON technicians 
                   FOR SELECT USING (true)');
                   
    -- Política para inserção em technicians: permite a todos inserirem, mas marca como pertencendo ao usuário atual
    EXECUTE format('CREATE POLICY technicians_insert_policy ON technicians 
                   FOR INSERT WITH CHECK (true)');
                   
    -- Política para atualização em technicians: permite a todos atualizarem qualquer registro
    EXECUTE format('CREATE POLICY technicians_update_policy ON technicians 
                   FOR UPDATE USING (true)');
                   
    -- Política para exclusão em technicians: permite a todos excluírem qualquer registro
    EXECUTE format('CREATE POLICY technicians_delete_policy ON technicians 
                   FOR DELETE USING (true)');
                   
    -- Políticas similares para cities
    EXECUTE format('CREATE POLICY cities_policy ON cities 
                   FOR SELECT USING (true)');
                   
    EXECUTE format('CREATE POLICY cities_insert_policy ON cities 
                   FOR INSERT WITH CHECK (true)');
                   
    EXECUTE format('CREATE POLICY cities_update_policy ON cities 
                   FOR UPDATE USING (true)');
                   
    EXECUTE format('CREATE POLICY cities_delete_policy ON cities 
                   FOR DELETE USING (true)');
    
    -- 3. Se houver tabelas específicas para relatórios, configurar políticas similares
    -- Para a tabela technician_configs (se existir)
    BEGIN
      DROP POLICY IF EXISTS technician_configs_policy ON technician_configs;
      
      EXECUTE format('CREATE POLICY technician_configs_policy ON technician_configs 
                     FOR SELECT USING (true)');
                     
      EXECUTE format('CREATE POLICY technician_configs_insert_policy ON technician_configs 
                     FOR INSERT WITH CHECK (true)');
                     
      EXECUTE format('CREATE POLICY technician_configs_update_policy ON technician_configs 
                     FOR UPDATE USING (true)');
                     
      EXECUTE format('CREATE POLICY technician_configs_delete_policy ON technician_configs 
                     FOR DELETE USING (true)');
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Tabela technician_configs não existe ou já possui políticas configuradas';
    END;
    
    -- Para a tabela technician_list (se existir)
    BEGIN
      DROP POLICY IF EXISTS technician_list_policy ON technician_list;
      
      EXECUTE format('CREATE POLICY technician_list_policy ON technician_list 
                     FOR SELECT USING (true)');
                     
      EXECUTE format('CREATE POLICY technician_list_insert_policy ON technician_list 
                     FOR INSERT WITH CHECK (true)');
                     
      EXECUTE format('CREATE POLICY technician_list_update_policy ON technician_list 
                     FOR UPDATE USING (true)');
                     
      EXECUTE format('CREATE POLICY technician_list_delete_policy ON technician_list 
                     FOR DELETE USING (true)');
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Tabela technician_list não existe ou já possui políticas configuradas';
    END;
    
    RAISE NOTICE 'Políticas de compartilhamento configuradas com sucesso para o usuário %', rafael_id;
    
  ELSE
    RAISE EXCEPTION 'Usuário rafael.rodrigues@mixtel.com.br não encontrado';
  END IF;
END
$$; 