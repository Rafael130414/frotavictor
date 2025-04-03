import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { MaintenanceForm } from './MaintenanceForm';
import { MaintenanceHistory } from './MaintenanceHistory';
import { MaintenanceExport } from './MaintenanceExport';
import { Car, MaintenanceRecord } from '../types';
import { FaCar, FaPlus, FaTimes, FaFileDownload } from 'react-icons/fa';

interface MaintenanceModuleProps {
  userId: string;
}

export function MaintenanceModule({ userId }: MaintenanceModuleProps) {
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshHistory, setRefreshHistory] = useState<number>(0); // Contador para forçar a atualização
  const [showExport, setShowExport] = useState<boolean>(false);
  
  // Referência para a seção de exportação
  const exportSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCars();
    
    // Carregar seleção do veículo do localStorage
    const savedCarId = localStorage.getItem('maintenanceSelectedCarId');
    if (savedCarId) {
      setSelectedCarId(savedCarId);
    }
  }, []);

  const fetchCars = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('model', { ascending: true });
      
      if (error) {
        console.error('Erro ao buscar veículos:', error);
        return;
      }
      
      const mappedCars = data.map(car => ({
        id: car.id,
        model: car.model,
        licensePlate: car.license_plate,
        year: car.year,
        createdAt: car.created_at,
        ipvaDueDate: car.ipva_due_date,
        ipvaPaid: car.ipva_paid,
        lastOilChangeDate: car.last_oil_change_date,
        lastOilChangeKm: car.last_oil_change_km
      }));
      
      setCars(mappedCars);
      
      // Se não houver seleção salva, seleciona o primeiro carro
      const savedCarId = localStorage.getItem('maintenanceSelectedCarId');
      if (mappedCars.length > 0 && !savedCarId) {
        setSelectedCarId(mappedCars[0].id);
        localStorage.setItem('maintenanceSelectedCarId', mappedCars[0].id);
      }
      // Se houver seleção salva mas o carro não existe mais, seleciona o primeiro
      else if (savedCarId && !mappedCars.find(car => car.id === savedCarId)) {
        if (mappedCars.length > 0) {
          setSelectedCarId(mappedCars[0].id);
          localStorage.setItem('maintenanceSelectedCarId', mappedCars[0].id);
        } else {
          setSelectedCarId(null);
          localStorage.removeItem('maintenanceSelectedCarId');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCarSelection = (carId: string) => {
    setSelectedCarId(carId);
    localStorage.setItem('maintenanceSelectedCarId', carId);
  };

  const handleAddButtonClick = () => {
    setEditingRecord(null);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  const handleSaveForm = () => {
    // Incrementar o contador para forçar a atualização do histórico
    setRefreshHistory(prev => prev + 1);
    setShowForm(false);
    setEditingRecord(null);
  };

  const handleEditRecord = (record: MaintenanceRecord) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleDeleteRecord = (recordId: string) => {
    // Incrementar o contador para forçar a atualização do histórico
    setRefreshHistory(prev => prev + 1);
    console.log('Registro excluído:', recordId);
  };

  const toggleExportSection = () => {
    const newValue = !showExport;
    setShowExport(newValue);
    
    // Se estiver abrindo a seção de exportação, faz o scroll
    if (newValue) {
      // Aguardar o re-render para garantir que o elemento existe no DOM
      setTimeout(() => {
        if (exportSectionRef.current) {
          exportSectionRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100);
    }
  };

  const selectedCar = cars.find(car => car.id === selectedCarId);

  if (loading && cars.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-white/5 rounded-xl border border-white/10">
        <FaCar className="text-gray-400 text-4xl mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Nenhum veículo encontrado</h2>
        <p className="text-gray-300 text-center mb-6 max-w-md">
          Você precisa adicionar veículos no módulo de Gestão de Veículos antes de registrar manutenções.
        </p>
        <button
          onClick={() => window.location.href = '#/cars'}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
        >
          Ir para Gestão de Veículos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seleção de veículo e botões de ação */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-gray-300 mb-1 flex items-center">
            <FaCar className="mr-2 text-blue-400" />
            <span>Selecione um Veículo</span>
          </label>
          <select
            value={selectedCarId || ''}
            onChange={(e) => handleCarSelection(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {cars.map(car => (
              <option key={car.id} value={car.id}>
                {car.model} ({car.licensePlate})
              </option>
            ))}
          </select>
        </div>
        <div className="flex-shrink-0 flex space-x-2">
          <button
            onClick={toggleExportSection}
            className="px-4 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center"
          >
            <FaFileDownload className="mr-2" />
            <span>Exportar</span>
          </button>
          
          {!showForm ? (
            <button
              onClick={handleAddButtonClick}
              className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-amber-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
            >
              <FaPlus className="mr-2" />
              <span>Adicionar Manutenção</span>
            </button>
          ) : (
            <button
              onClick={handleCancelForm}
              className="px-6 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center space-x-2"
            >
              <FaTimes className="mr-2" />
              <span>Cancelar</span>
            </button>
          )}
        </div>
      </div>

      {/* Formulário de adicionar/editar */}
      {showForm && (
        <div className="mb-6">
          <MaintenanceForm
            userId={userId}
            editingRecord={editingRecord}
            onSave={handleSaveForm}
            onCancel={handleCancelForm}
            selectedCarId={selectedCarId}
          />
        </div>
      )}

      {/* Histórico de manutenções */}
      <MaintenanceHistory
        key={`${selectedCarId}-${refreshHistory}`} // Forçar recriação do componente quando mudar o carro ou após uma atualização
        carId={selectedCarId}
        onEdit={handleEditRecord}
        onDelete={handleDeleteRecord}
      />
      
      {/* Seção de exportação */}
      {showExport && (
        <div className="mt-8" ref={exportSectionRef}>
          <MaintenanceExport userId={userId} cars={cars} />
        </div>
      )}
    </div>
  );
} 