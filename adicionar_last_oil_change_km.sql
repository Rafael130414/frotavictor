-- Script para garantir que a tabela cars tenha a coluna last_oil_change_km

-- Verificar e adicionar a coluna last_oil_change_km na tabela cars se não existir
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'cars' AND column_name = 'last_oil_change_km'
  ) THEN
    ALTER TABLE public.cars ADD COLUMN last_oil_change_km integer;
    
    -- Atualizar os registros existentes com base na última entrada de abastecimento
    -- após a data da última troca de óleo (quando disponível)
    RAISE NOTICE 'Coluna last_oil_change_km adicionada. Para atualizar os dados existentes, execute o script de atualização de quilometragem.';
  ELSE
    RAISE NOTICE 'A coluna last_oil_change_km já existe na tabela cars.';
  END IF;
END $$;

/*
-- Script para atualizar a quilometragem da última troca para carros existentes
-- IMPORTANTE: Execute isso apenas após avaliar os dados e se certificar que deseja atualizar automaticamente

DO $$ 
DECLARE
  car_record RECORD;
  entry_record RECORD;
BEGIN
  -- Iterar sobre carros que têm data de troca mas não têm a quilometragem
  FOR car_record IN 
    SELECT id, last_oil_change_date 
    FROM public.cars 
    WHERE last_oil_change_date IS NOT NULL AND last_oil_change_km IS NULL
  LOOP
    -- Buscar a entrada de abastecimento mais próxima da data da troca de óleo
    SELECT current_km INTO entry_record
    FROM public.fuel_entries
    WHERE car_id = car_record.id
    ORDER BY ABS(EXTRACT(EPOCH FROM (date::timestamp - car_record.last_oil_change_date::timestamp)))
    LIMIT 1;
    
    -- Se encontrou uma entrada, atualizar a quilometragem da troca de óleo
    IF entry_record.current_km IS NOT NULL THEN
      UPDATE public.cars
      SET last_oil_change_km = entry_record.current_km
      WHERE id = car_record.id;
      
      RAISE NOTICE 'Atualizado car_id: %, quilometragem: %', car_record.id, entry_record.current_km;
    END IF;
  END LOOP;
END $$;
*/
