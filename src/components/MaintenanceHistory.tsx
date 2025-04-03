import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MaintenanceRecord, Car } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FaEdit, FaTrash, FaCar, FaCalendarAlt, FaMapMarkerAlt, FaMoneyBillWave, FaTools, FaSync } from 'react-icons/fa';

interface MaintenanceHistoryProps {
  carId: string | null;
  onEdit: (record: MaintenanceRecord) => void;
  onDelete: (recordId: string) => void;
}

export function MaintenanceHistory({ carId, onEdit, onDelete }: MaintenanceHistoryProps) {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [car, setCar] = useState<Car | null>(null);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Efeito para carregar dados quando o componente é montado ou o carId muda
  useEffect(() => {
    if (carId) {
      fetchMaintenanceRecords();
      fetchCarDetails();
    } else {
      setRecords([]);
      setCar(null);
      setTotalSpent(0);
    }
  }, [carId]);

  const fetchCarDetails = async () => {
    if (!carId) return;

    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', carId)
        .single();
      
      if (error) {
        console.error('Erro ao buscar detalhes do veículo:', error);
        return;
      }
      
      setCar({
        id: data.id,
        model: data.model,
        licensePlate: data.license_plate,
        year: data.year,
        createdAt: data.created_at,
        ipvaDueDate: data.ipva_due_date,
        ipvaPaid: data.ipva_paid,
        lastOilChangeDate: data.last_oil_change_date,
        lastOilChangeKm: data.last_oil_change_km
      });
    } catch (error) {
      console.error('Erro ao buscar detalhes do veículo:', error);
    }
  };

  const fetchMaintenanceRecords = async () => {
    if (!carId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('car_id', carId)
        .order('maintenance_date', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar registros de manutenção:', error);
        return;
      }
      
      const mappedRecords = data.map(record => ({
        id: record.id,
        carId: record.car_id,
        userId: record.user_id,
        date: record.maintenance_date,
        location: record.location,
        issueDescription: record.issue_description,
        cost: record.cost,
        currentKm: record.current_km,
        notes: record.notes,
        createdAt: record.created_at
      }));
      
      setRecords(mappedRecords);
      
      // Calcular total gasto
      const total = mappedRecords.reduce((sum, record) => sum + record.cost, 0);
      setTotalSpent(total);
    } catch (error) {
      console.error('Erro ao buscar registros de manutenção:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMaintenanceRecords();
    setRefreshing(false);
  };

  const handleDeleteClick = (recordId: string) => {
    setConfirmDelete(recordId);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    
    try {
      const { error } = await supabase
        .from('maintenance_records')
        .delete()
        .eq('id', confirmDelete);
      
      if (error) {
        console.error('Erro ao excluir registro de manutenção:', error);
        return;
      }
      
      // Notificar o componente pai
      onDelete(confirmDelete);
      
      // Atualizar localmente o estado para remover o registro
      const updatedRecords = records.filter(record => record.id !== confirmDelete);
      setRecords(updatedRecords);
      
      // Recalcular total gasto
      const total = updatedRecords.reduce((sum, record) => sum + record.cost, 0);
      setTotalSpent(total);
    } catch (error) {
      console.error('Erro ao excluir registro de manutenção:', error);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };

  if (!carId) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-400 text-center">
          Selecione um veículo para visualizar o histórico de manutenções
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Informações do veículo */}
      {car && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/10 rounded-xl">
              <FaCar className="text-blue-400 text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">
                {car.model} <span className="text-gray-400 text-sm">({car.licensePlate})</span>
              </h3>
              <p className="text-gray-400 text-sm">Ano: {car.year}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white/5 p-3 rounded-xl flex items-center space-x-2">
              <FaMoneyBillWave className="text-green-400" />
              <div>
                <p className="text-xs text-gray-400">Total gasto em manutenções</p>
                <p className="text-xl font-bold text-green-400">R$ {totalSpent.toFixed(2)}</p>
              </div>
            </div>
            <button 
              onClick={handleRefresh}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-blue-400"
              title="Atualizar dados"
              disabled={refreshing}
            >
              <FaSync className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      )}

      {/* Lista de manutenções */}
      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white/5 rounded-xl border border-white/10">
          <FaTools className="text-gray-400 text-4xl mb-4" />
          <p className="text-gray-300 text-center mb-2">Nenhum registro de manutenção encontrado</p>
          <p className="text-gray-400 text-center text-sm max-w-md">
            Este veículo ainda não possui registros de manutenção. Adicione o primeiro registro usando o formulário acima.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div 
              key={record.id} 
              className="bg-white/5 rounded-xl border border-white/10 overflow-hidden transition-all hover:bg-white/10"
            >
              {/* Cabeçalho */}
              <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <FaTools className="text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white">
                      {record.issueDescription.length > 60
                        ? `${record.issueDescription.substring(0, 60)}...`
                        : record.issueDescription}
                    </h4>
                    <div className="flex flex-wrap items-center text-sm space-x-4 mt-1">
                      <div className="flex items-center text-gray-400">
                        <FaCalendarAlt className="mr-1 text-blue-400" />
                        {format(parseISO(record.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                      <div className="flex items-center text-gray-400">
                        <FaMapMarkerAlt className="mr-1 text-blue-400" />
                        {record.location}
                      </div>
                      {record.currentKm && (
                        <div className="flex items-center text-gray-400">
                          <span className="mr-1 text-blue-400">KM</span>
                          {record.currentKm.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Valor</p>
                    <p className="text-xl font-semibold text-green-400">R$ {record.cost.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEdit(record)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-blue-400"
                      title="Editar"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(record.id)}
                      className="p-2 bg-white/10 hover:bg-red-500/20 rounded-lg text-red-400"
                      title="Excluir"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Notas (opcionais) */}
              {record.notes && (
                <div className="p-4 bg-white/5">
                  <h5 className="text-sm font-medium text-gray-300 mb-1">Observações:</h5>
                  <p className="text-gray-400 text-sm">{record.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Modal de confirmação de exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#1e293b] rounded-xl border border-white/10 p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Confirmar exclusão</h3>
            <p className="text-gray-300 mb-6">
              Tem certeza que deseja excluir este registro de manutenção? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 