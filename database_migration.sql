-- Arquivo de migração para o banco de dados
-- Criado automaticamente a partir da análise do banco de dados existente

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Definição das tabelas
-- Tabela: users
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    avatar_url text
);

-- Tabela: user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id),
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Tabela: cities
CREATE TABLE IF NOT EXISTS public.cities (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name character varying NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    user_id uuid REFERENCES public.users(id)
);

-- Tabela: cars
CREATE TABLE IF NOT EXISTS public.cars (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id),
    model text NOT NULL,
    license_plate text NOT NULL,
    year integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    ipva_due_date date,
    ipva_paid boolean DEFAULT false,
    last_oil_change_date date,
    last_oil_change_km integer
);

-- Tabela: fuel_entries
CREATE TABLE IF NOT EXISTS public.fuel_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    car_id uuid NOT NULL REFERENCES public.cars(id),
    user_id uuid NOT NULL REFERENCES public.users(id),
    date date NOT NULL,
    current_km numeric NOT NULL,
    liters numeric NOT NULL,
    total_cost numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Tabela: technician_list
CREATE TABLE IF NOT EXISTS public.technician_list (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    user_id uuid NOT NULL REFERENCES public.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: technicians
CREATE TABLE IF NOT EXISTS public.technicians (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name character varying NOT NULL,
    city_id uuid REFERENCES public.cities(id),
    date date NOT NULL,
    food_expense numeric NOT NULL DEFAULT 0,
    fuel_expense numeric NOT NULL DEFAULT 0,
    other_expense numeric NOT NULL DEFAULT 0,
    accommodation_expense numeric NOT NULL DEFAULT 0,
    service_orders integer NOT NULL DEFAULT 0,
    user_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tabela: technician_configs
CREATE TABLE IF NOT EXISTS public.technician_configs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_order_value numeric NOT NULL DEFAULT 0,
    user_id uuid NOT NULL REFERENCES public.users(id),
    created_at timestamp with time zone DEFAULT now()
);

-- Tabela: settings
CREATE TABLE IF NOT EXISTS public.settings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_order_value numeric NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tabela: attachments
CREATE TABLE IF NOT EXISTS public.attachments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name text NOT NULL,
    description text,
    file_type text NOT NULL,
    file_size text NOT NULL,
    file_path text NOT NULL,
    date_uploaded timestamp with time zone DEFAULT now(),
    url text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Configurando RLS em todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para a tabela users
CREATE POLICY "Permitir select para todos" ON public.users FOR SELECT USING (true);
CREATE POLICY "Permitir update do próprio registro" ON public.users FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "selective_users_policy" ON public.users USING (
    CASE
        WHEN (auth.email() = 'victor@mixtel.com.br') THEN (auth.uid() = id)
        ELSE true
    END
);

-- Políticas RLS para a tabela user_roles
CREATE POLICY "Política de visualização de papéis" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Política de modificação de papéis" ON public.user_roles USING (
    EXISTS (SELECT 1 FROM user_roles user_roles_1 WHERE ((user_roles_1.user_id = auth.uid()) AND (user_roles_1.role = 'admin')))
);

-- Políticas RLS para a tabela cities
CREATE POLICY "cities_policy" ON public.cities FOR SELECT USING (true);
CREATE POLICY "cities_insert_policy" ON public.cities FOR INSERT WITH CHECK (true);
CREATE POLICY "cities_update_policy" ON public.cities FOR UPDATE USING (true);
CREATE POLICY "cities_delete_policy" ON public.cities FOR DELETE USING (true);

-- Políticas RLS para a tabela cars
CREATE POLICY "cars_policy" ON public.cars USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view their own cars" ON public.cars FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cars" ON public.cars FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cars" ON public.cars FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cars" ON public.cars FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para a tabela fuel_entries
CREATE POLICY "fuel_entries_policy" ON public.fuel_entries USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view their own fuel entries" ON public.fuel_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own fuel entries" ON public.fuel_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own fuel entries" ON public.fuel_entries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own fuel entries" ON public.fuel_entries FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "selective_fuel_entries_policy" ON public.fuel_entries USING (
    CASE
        WHEN (auth.email() = 'victor@mixtel.com.br') THEN (auth.uid() = user_id)
        ELSE true
    END
);

-- Políticas RLS para a tabela technician_list
CREATE POLICY "technician_list_policy" ON public.technician_list FOR SELECT USING (true);
CREATE POLICY "technician_list_insert_policy" ON public.technician_list FOR INSERT WITH CHECK (true);
CREATE POLICY "technician_list_update_policy" ON public.technician_list FOR UPDATE USING (true);
CREATE POLICY "technician_list_delete_policy" ON public.technician_list FOR DELETE USING (true);

-- Políticas RLS para a tabela technicians
CREATE POLICY "technicians_policy" ON public.technicians FOR SELECT USING (true);
CREATE POLICY "technicians_insert_policy" ON public.technicians FOR INSERT WITH CHECK (true);
CREATE POLICY "technicians_update_policy" ON public.technicians FOR UPDATE USING (true);
CREATE POLICY "technicians_delete_policy" ON public.technicians FOR DELETE USING (true);
CREATE POLICY "Permitir leitura de técnicos pelo próprio usuário" ON public.technicians FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Permitir inserção de técnicos pelo próprio usuário" ON public.technicians FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Permitir atualização de técnicos pelo próprio usuário" ON public.technicians FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "selective_technicians_policy" ON public.technicians USING (
    CASE
        WHEN (auth.email() = 'victor@mixtel.com.br') THEN (auth.uid() = user_id)
        ELSE true
    END
);

-- Políticas RLS para a tabela technician_configs
CREATE POLICY "technician_configs_policy" ON public.technician_configs FOR SELECT USING (true);
CREATE POLICY "technician_configs_insert_policy" ON public.technician_configs FOR INSERT WITH CHECK (true);
CREATE POLICY "technician_configs_update_policy" ON public.technician_configs FOR UPDATE USING (true);
CREATE POLICY "technician_configs_delete_policy" ON public.technician_configs FOR DELETE USING (true);
CREATE POLICY "technician_configs_select_policy" ON public.technician_configs FOR SELECT USING (auth.uid() = user_id);

-- Políticas RLS para a tabela settings
CREATE POLICY "Permitir leitura de configurações pelo usuário autenticado" ON public.settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização de configurações pelo usuário autenti" ON public.settings FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas RLS para a tabela attachments
CREATE POLICY "Permitir select para usuários autenticados" ON public.attachments FOR SELECT USING (true);
CREATE POLICY "Permitir insert para usuários autenticados" ON public.attachments FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir delete para usuários autenticados" ON public.attachments FOR DELETE USING (true);

-- Inserção de dados de exemplo
-- Inserindo usuários
INSERT INTO public.users (id, email, created_at, updated_at, avatar_url)
VALUES
    ('03a6f729-d97b-44c1-a034-ec9931728c72', 'teste@gmail.com', '2025-03-18T01:38:59.460544Z', '2025-03-18T17:50:14.389775Z', null),
    ('22a56dbe-a796-4c0f-a20b-a4bd2d24af24', 'winicyus.martins@mixtel.com.br', '2025-03-18T01:51:31.495839Z', '2025-03-21T22:04:27.081003Z', 'https://jmgmnswkjncarevymexs.supabase.co/storage/v1/object/public/avatars/22a56dbe-a796-4c0f-a20b-a4bd2d24af24/avatar-1742320228901.png?v=1742320228901'),
    ('faad060a-b718-4012-9bba-3ec1b69ab57e', 'victor@mixtel.com.br', '2025-03-17T23:59:59.999999Z', '2025-03-17T23:59:59.999999Z', null)
ON CONFLICT (id) DO NOTHING;

-- Inserindo funções de usuário
INSERT INTO public.user_roles (id, user_id, role, created_at)
VALUES
    ('e92be632-7321-471c-b4cb-da36dc9b94c2', 'faad060a-b718-4012-9bba-3ec1b69ab57e', 'admin', '2025-03-18T01:35:52.024394Z')
ON CONFLICT (id) DO NOTHING;

-- Inserindo cidades
INSERT INTO public.cities (id, name, created_at, user_id)
VALUES
    ('9988f1d5-d348-42c6-b382-eaf02562d284', 'Alto Araguaia/Santa Rita', '2025-03-18T00:34:25.260210Z', 'faad060a-b718-4012-9bba-3ec1b69ab57e'),
    ('27192f56-f871-4a01-a821-052346445749', 'Serranópolis', '2025-03-18T02:09:39.272154Z', '22a56dbe-a796-4c0f-a20b-a4bd2d24af24')
ON CONFLICT (id) DO NOTHING;

-- Inserindo carros
INSERT INTO public.cars (id, user_id, model, license_plate, year, created_at, ipva_due_date, ipva_paid, last_oil_change_date, last_oil_change_km)
VALUES
    ('62e640c0-9b39-40be-87e7-d9409ed0c8d9', 'faad060a-b718-4012-9bba-3ec1b69ab57e', 'Edeilton', 'OMK8014', 2000, '2025-02-11T11:57:15.672605Z', null, true, null, null),
    ('66290fdd-21bb-48b9-bba0-be52ea29e274', 'faad060a-b718-4012-9bba-3ec1b69ab57e', 'Winicyus', 'OMU3C07', 2012, '2025-02-11T11:59:02.890174Z', null, true, null, null),
    ('11ddb529-63ef-4bf9-9a6e-df05db9035ae', 'faad060a-b718-4012-9bba-3ec1b69ab57e', 'Toyota', 'ABC1234', 2020, '2025-02-10T10:00:00.000000Z', null, true, null, null)
ON CONFLICT (id) DO NOTHING;

-- Inserindo registros de abastecimento
INSERT INTO public.fuel_entries (id, car_id, user_id, date, current_km, liters, total_cost, created_at)
VALUES
    ('b40be29f-7031-49c2-a2a3-87b5587d9e82', '11ddb529-63ef-4bf9-9a6e-df05db9035ae', 'faad060a-b718-4012-9bba-3ec1b69ab57e', '2025-02-05', 235552, 23.47, 150, '2025-02-20T13:43:11.991625Z'),
    ('e234e39f-953d-4e5d-9303-baad4a58e413', '11ddb529-63ef-4bf9-9a6e-df05db9035ae', 'faad060a-b718-4012-9bba-3ec1b69ab57e', '2025-02-12', 235855, 16.155, 100, '2025-02-20T13:49:31.133823Z')
ON CONFLICT (id) DO NOTHING;

-- Inserindo lista de técnicos
INSERT INTO public.technician_list (id, name, user_id, created_at, updated_at)
VALUES
    ('a61c82c8-462d-40f4-b85a-b2604c0d99de', 'Wanderson', 'faad060a-b718-4012-9bba-3ec1b69ab57e', '2025-03-18T01:20:27.892984Z', '2025-03-18T01:20:27.892984Z'),
    ('2158d0aa-3716-4ce0-822c-6e5241ee76a7', 'Gerson', 'faad060a-b718-4012-9bba-3ec1b69ab57e', '2025-03-18T01:20:51.067364Z', '2025-03-18T01:20:51.067364Z')
ON CONFLICT (id) DO NOTHING;

-- Inserindo técnicos
INSERT INTO public.technicians (id, name, city_id, date, food_expense, fuel_expense, other_expense, accommodation_expense, service_orders, user_id, created_at)
VALUES
    ('6a1bc70b-450d-4bac-a2b4-022263ef7326', 'Vinicius', '9988f1d5-d348-42c6-b382-eaf02562d284', '2025-03-13', 38.00, 100.00, 0.00, 0.00, 6, 'faad060a-b718-4012-9bba-3ec1b69ab57e', '2025-03-18T10:48:08.474826Z'),
    ('b868c1ef-cfcb-4367-97cd-5e704c992853', 'Paulo', '27192f56-f871-4a01-a821-052346445749', '2025-03-14', 0.00, 300.00, 0.00, 0.00, 60, 'faad060a-b718-4012-9bba-3ec1b69ab57e', '2025-03-18T10:48:36.201908Z')
ON CONFLICT (id) DO NOTHING;

-- Inserindo configurações de técnicos
INSERT INTO public.technician_configs (id, service_order_value, user_id, created_at)
VALUES
    ('11e8d958-b30b-41de-af66-c079a3890124', 90.00, '22a56dbe-a796-4c0f-a20b-a4bd2d24af24', '2025-03-18T02:03:56.198317Z'),
    ('dde95cd1-d9d0-4dd4-a4ca-78ce97950033', 90.00, 'faad060a-b718-4012-9bba-3ec1b69ab57e', '2025-03-18T00:34:37.668970Z')
ON CONFLICT (id) DO NOTHING;

-- Comentário final
COMMENT ON TABLE public.technicians IS 'Tabela para registro de despesas e ordens de serviço dos técnicos';
COMMENT ON TABLE public.cities IS 'Tabela para armazenar as cidades onde os técnicos realizam trabalhos';
COMMENT ON TABLE public.technician_configs IS 'Tabela para configurações de valor da ordem de serviço'; 