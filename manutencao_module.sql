-- ========================================================
-- MÓDULO DE GASTOS DE MANUTENÇÃO - SCRIPT SQL
-- ========================================================

-- Criar tabela para registros de manutenção
CREATE TABLE maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    maintenance_date DATE NOT NULL,
    location VARCHAR(255) NOT NULL,
    issue_description TEXT NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    current_km INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT positive_cost CHECK (cost >= 0)
);

-- Comentários para documentação da tabela
COMMENT ON TABLE maintenance_records IS 'Registros de manutenção de veículos';
COMMENT ON COLUMN maintenance_records.car_id IS 'ID do veículo relacionado à manutenção';
COMMENT ON COLUMN maintenance_records.user_id IS 'ID do usuário proprietário do registro';
COMMENT ON COLUMN maintenance_records.maintenance_date IS 'Data em que a manutenção foi realizada';
COMMENT ON COLUMN maintenance_records.location IS 'Local onde a manutenção foi realizada (oficina, concessionária)';
COMMENT ON COLUMN maintenance_records.issue_description IS 'Descrição do problema ou serviço realizado';
COMMENT ON COLUMN maintenance_records.cost IS 'Custo total da manutenção em reais';
COMMENT ON COLUMN maintenance_records.current_km IS 'Quilometragem do veículo no momento da manutenção';
COMMENT ON COLUMN maintenance_records.notes IS 'Observações adicionais sobre a manutenção';

-- Índices para melhorar a performance das consultas
CREATE INDEX idx_maintenance_car_id ON maintenance_records(car_id);
CREATE INDEX idx_maintenance_user_id ON maintenance_records(user_id);
CREATE INDEX idx_maintenance_date ON maintenance_records(maintenance_date);

-- Configurar RLS (Row Level Security)
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

-- Política para que usuários só possam ver seus próprios registros
CREATE POLICY maintenance_select_policy ON maintenance_records 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Política para que usuários só possam inserir registros próprios
CREATE POLICY maintenance_insert_policy ON maintenance_records 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Política para que usuários só possam atualizar seus próprios registros
CREATE POLICY maintenance_update_policy ON maintenance_records 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Política para que usuários só possam excluir seus próprios registros
CREATE POLICY maintenance_delete_policy ON maintenance_records 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Trigger para atualizar o timestamp quando um registro for atualizado
CREATE OR REPLACE FUNCTION update_maintenance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maintenance_updated
BEFORE UPDATE ON maintenance_records
FOR EACH ROW
EXECUTE FUNCTION update_maintenance_timestamp();

-- Função para obter total gasto em manutenção por veículo
CREATE OR REPLACE FUNCTION get_maintenance_total_by_car(car_uuid UUID, start_date DATE, end_date DATE)
RETURNS DECIMAL AS $$
    SELECT COALESCE(SUM(cost), 0)
    FROM maintenance_records
    WHERE car_id = car_uuid
    AND maintenance_date BETWEEN start_date AND end_date;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Função para obter total gasto em manutenção por usuário
CREATE OR REPLACE FUNCTION get_maintenance_total_by_user(user_uuid UUID, start_date DATE, end_date DATE)
RETURNS DECIMAL AS $$
    SELECT COALESCE(SUM(cost), 0)
    FROM maintenance_records
    WHERE user_id = user_uuid
    AND maintenance_date BETWEEN start_date AND end_date;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Conceder permissões necessárias
GRANT SELECT, INSERT, UPDATE, DELETE ON maintenance_records TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE maintenance_records_id_seq TO authenticated; 