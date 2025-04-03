import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Car, MaintenanceRecord } from '../types';
import { FaCar, FaMapMarkerAlt, FaTools, FaMoneyBillWave, FaTachometerAlt, FaCalendarAlt, FaClipboardList } from 'react-icons/fa';
import { format } from 'date-fns';

interface MaintenanceFormProps {
  userId: string;
  editingRecord: MaintenanceRecord | null;
  onSave: () => void;
  onCancel: () => void;
  selectedCarId?: string | null;
}

export function MaintenanceForm({ userId, editingRecord, onSave, onCancel, selectedCarId }: MaintenanceFormProps) {
  const [cars, setCars] = useState<Car[]>([]);
  const [carId, setCarId] = useState<string>('');
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [location, setLocation] = useState<string>('');
  const [issueDescription, setIssueDescription] = useState<string>('');
  const [cost, setCost] = useState<string>('');
  const [currentKm, setCurrentKm] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchCars();
  }, []);

  useEffect(() => {
    if (editingRecord) {
      setCarId(editingRecord.carId);
      setDate(editingRecord.date);
      setLocation(editingRecord.location);
      setIssueDescription(editingRecord.issueDescription);
      setCost(editingRecord.cost.toString());
      setCurrentKm(editingRecord.currentKm?.toString() || '');
      setNotes(editingRecord.notes || '');
    } else {
      resetForm();
    }
  }, [editingRecord]);

  useEffect(() => {
    if (!editingRecord && selectedCarId) {
      setCarId(selectedCarId);
    }
  }, [selectedCarId, editingRecord]);

  const fetchCars = async () => {
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
      
      if (!editingRecord && mappedCars.length > 0 && !carId) {
        if (selectedCarId) {
          setCarId(selectedCarId);
        } else {
          setCarId(mappedCars[0].id);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
    }
  };

  const resetForm = () => {
    if (selectedCarId) {
      setCarId(selectedCarId);
    } else {
      setCarId(cars.length > 0 ? cars[0].id : '');
    }
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setLocation('');
    setIssueDescription('');
    setCost('');
    setCurrentKm('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!carId || !date || !location || !issueDescription || !cost) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const maintenanceData = {
        car_id: carId,
        user_id: userId,
        maintenance_date: date,
        location,
        issue_description: issueDescription,
        cost: parseFloat(cost),
        current_km: currentKm ? parseInt(currentKm) : null,
        notes: notes || null
      };
      
      let result;
      
      if (editingRecord) {
        // Atualizar registro existente
        result = await supabase
          .from('maintenance_records')
          .update(maintenanceData)
          .eq('id', editingRecord.id)
          .select();
      } else {
        // Inserir novo registro
        result = await supabase
          .from('maintenance_records')
          .insert([maintenanceData])
          .select();
      }
      
      if (result.error) {
        throw result.error;
      }
      
      setSuccess(editingRecord ? 'Registro atualizado com sucesso!' : 'Registro adicionado com sucesso!');
      resetForm();
      
      // Notificar o componente pai imediatamente para atualizar o histórico
      onSave();
      
      // Manter a mensagem de sucesso por um curto período
      setTimeout(() => {
        setSuccess(null);
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao salvar registro de manutenção:', error);
      setError(error.message || 'Erro ao salvar o registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 p-6">
      <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-400 mb-6">
        {editingRecord ? 'Editar Registro de Manutenção' : 'Adicionar Novo Registro de Manutenção'}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-200">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Veículo */}
          <div>
            <label className="block text-gray-300 mb-1 flex items-center">
              <FaCar className="mr-2 text-blue-400" />
              <span>Veículo <span className="text-red-400">*</span></span>
            </label>
            <select
              value={carId}
              onChange={(e) => setCarId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Selecione um veículo</option>
              {cars.map(car => (
                <option key={car.id} value={car.id}>
                  {car.model} ({car.licensePlate})
                </option>
              ))}
            </select>
          </div>
          
          {/* Data */}
          <div>
            <label className="block text-gray-300 mb-1 flex items-center">
              <FaCalendarAlt className="mr-2 text-blue-400" />
              <span>Data da Manutenção <span className="text-red-400">*</span></span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          {/* Local */}
          <div>
            <label className="block text-gray-300 mb-1 flex items-center">
              <FaMapMarkerAlt className="mr-2 text-blue-400" />
              <span>Local <span className="text-red-400">*</span></span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Oficina, concessionária, etc."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          {/* Quilometragem */}
          <div>
            <label className="block text-gray-300 mb-1 flex items-center">
              <FaTachometerAlt className="mr-2 text-blue-400" />
              <span>Quilometragem Atual</span>
            </label>
            <input
              type="number"
              value={currentKm}
              onChange={(e) => setCurrentKm(e.target.value)}
              placeholder="Quilometragem no momento da manutenção"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Custo */}
          <div>
            <label className="block text-gray-300 mb-1 flex items-center">
              <FaMoneyBillWave className="mr-2 text-blue-400" />
              <span>Valor Gasto <span className="text-red-400">*</span></span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">R$</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0,00"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>
        
        {/* Descrição do problema */}
        <div>
          <label className="block text-gray-300 mb-1 flex items-center">
            <FaTools className="mr-2 text-blue-400" />
            <span>Descrição do Problema <span className="text-red-400">*</span></span>
          </label>
          <textarea
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            placeholder="Descreva o problema ou defeito que motivou a manutenção"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
            required
          />
        </div>
        
        {/* Observações */}
        <div>
          <label className="block text-gray-300 mb-1 flex items-center">
            <FaClipboardList className="mr-2 text-blue-400" />
            <span>Observações</span>
          </label>
          <textarea
            value={notes || ''}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Informações adicionais sobre a manutenção (opcional)"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
          />
        </div>
        
        {/* Botões */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-amber-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Salvando...</span>
              </>
            ) : (
              <span>{editingRecord ? 'Atualizar' : 'Salvar'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 