import React, { useState } from 'react';
import { FuelEntry } from '../types';
import { Trash2, Edit3, Calendar, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO, isSameMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportToCSV } from '../utils';

interface FuelHistoryProps {
  entries: FuelEntry[];
  onEdit: (entry: FuelEntry) => void;
  onDelete: (entryId: string) => void;
}

export const FuelHistory: React.FC<FuelHistoryProps> = ({ entries, onEdit, onDelete }) => {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  
  const formatDate = (dateString: string) => {
    const date = parseISO(`${dateString.split('T')[0]}T12:00:00`);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };
  
  const handlePreviousMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => addMonths(prev, 1));
  };
  
  // Filtrar entradas pelo mês selecionado
  const filteredEntries = entries.filter(entry => 
    isSameMonth(parseISO(entry.date), selectedMonth)
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <Calendar className="h-5 w-5 text-blue-600" strokeWidth={2} />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
            Histórico de Abastecimentos
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white/5 px-3 py-2 rounded-lg">
            <button
              onClick={handlePreviousMonth}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-300" />
            </button>
            <span className="text-gray-200 font-medium">
              {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-300" />
            </button>
          </div>
          <button
            onClick={() => exportToCSV(filteredEntries)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
          >
            <Download className="w-5 h-5 mr-2" strokeWidth={2} />
            Exportar CSV
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-white/10 shadow-lg">
        <table className="min-w-full divide-y divide-white/10">
          <thead>
            <tr className="bg-white/5">
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">
                Quilometragem
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">
                Litros
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">
                Valor Total
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-300 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
                  Nenhum abastecimento registrado no mês selecionado
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                    {formatDate(entry.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                    {entry.currentKm} km
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                    {entry.liters.toFixed(2)} L
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                    R$ {entry.totalCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onEdit(entry)}
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all duration-200"
                        title="Editar"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(entry.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};