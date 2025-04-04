-- Script para garantir que a tabela users contenha a coluna avatar_url e as permissões corretas

-- 1. Verificar e adicionar a coluna avatar_url na tabela users se não existir
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.users ADD COLUMN avatar_url text;
  END IF;
END $$;

-- 2. Garantir que todos os usuários possam buscar informações (SELECT) de qualquer usuário
-- Isso é necessário para que o avatar possa ser exibido na tela de login com base apenas no email
-- Primeiro verificamos se a política já existe para evitar duplicação
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Permitir select para todos'
  ) THEN
    EXECUTE 'CREATE POLICY "Permitir select para todos" ON public.users FOR SELECT USING (true)';
  END IF;
END $$;

-- 3. Garantir que usuários autenticados possam atualizar seus próprios registros
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Permitir update do próprio avatar'
  ) THEN
    EXECUTE 'CREATE POLICY "Permitir update do próprio avatar" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id)';
  END IF;
END $$;

-- 4. Configurar RLS para o bucket de avatars no storage
-- IMPORTANTE: Estas configurações precisam ser feitas manualmente no console do Supabase
-- Crie uma política para o bucket "avatars" com as seguintes configurações:

/* 
No console do Supabase (https://app.supabase.com):
1. Vá para Storage > Buckets
2. Selecione o bucket "avatars" (crie-o se não existir)
3. Vá para "Policies"
4. Adicione as seguintes políticas:

Política de SELECT (download):
- Nome: "Permitir download de avatares para todos"
- Definição: () => true

Política de INSERT (upload):
- Nome: "Permitir upload apenas para usuários autenticados"
- Definição: (auth.role() === 'authenticated')

Política de UPDATE:
- Nome: "Permitir atualização apenas para donos dos arquivos"
- Definição: ((auth.uid() = owner) OR (auth.uid() IN (SELECT id FROM users WHERE role = 'admin')))

Política de DELETE:
- Nome: "Permitir deleção apenas para donos dos arquivos"
- Definição: ((auth.uid() = owner) OR (auth.uid() IN (SELECT id FROM users WHERE role = 'admin')))
*/

-- 5. Atualizar avatar_url de usuários existentes sem avatar (se você tiver arquivos no storage)
-- Este comando busca avatares no storage para usuários sem avatar_url definido
-- Execute este comando apenas após configurar as políticas do Storage acima

/*
DO $$ 
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM public.users WHERE avatar_url IS NULL
  LOOP
    -- Este comando precisa ser executado pela API ou serverless function
    -- devido à limitação do SQL em acessar funções do storage
    -- Use este exemplo como referência para um script serverless
    -- que você pode executar manualmente
    
    -- Exemplo pseudocódigo para serverless function:
    -- const { data: files } = await supabase.storage.from('avatars').list(userId);
    -- if (files && files.length > 0) {
    --   const { publicUrl } = supabase.storage.from('avatars').getPublicUrl(`${userId}/${files[0].name}`);
    --   await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', userId);
    -- }
  END LOOP;
END $$;
*/
