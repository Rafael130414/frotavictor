import React, { useState, useEffect } from 'react';
import { FaFileDownload, FaFileExcel, FaFilePdf, FaCar, FaCalendarAlt } from 'react-icons/fa';
import { format, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Car } from '../types';
import { exportAllMaintenanceData, exportCarMaintenanceData } from '../utils';

interface MaintenanceExportProps {
  userId: string;
  cars: Car[];
}

export function MaintenanceExport({ userId, cars }: MaintenanceExportProps) {
  const [selectedCarId, setSelectedCarId] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [exportType, setExportType] = useState<'pdf' | 'excel'>('pdf');
  const [exporting, setExporting] = useState<boolean>(false);
  const [exportResult, setExportResult] = useState<{ success: boolean; message: string } | null>(null);

  // Array de anos para o seletor (últimos 5 anos)
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  // Adicionar 2026 à lista de anos
  years.unshift(2026);
  
  // Array de meses para o seletor
  const months = Array.from({ length: 12 }, (_, i) => i);

  const getMonthName = (monthIndex: number) => {
    const date = new Date();
    date.setMonth(monthIndex);
    return format(date, 'MMMM', { locale: ptBR });
  };

  const handleExport = async () => {
    setExporting(true);
    setExportResult(null);
    
    try {
      // Preparar os parâmetros de exportação
      const selectedCar = selectedCarId === 'all' ? null : cars.find(car => car.id === selectedCarId);
      const monthDate = selectedMonth !== null ? new Date(selectedYear, selectedMonth, 1) : null;
      
      let success = false;
      
      if (selectedCar) {
        // Exportar dados de um veículo específico
        success = await exportCarMaintenanceData(
          selectedCar,
          userId,
          monthDate,
          selectedYear,
          exportType
        );
      } else {
        // Exportar dados de todos os veículos
        success = await exportAllMaintenanceData(
          cars,
          userId,
          monthDate,
          selectedYear,
          exportType
        );
      }
      
      setExportResult({
        success,
        message: success 
          ? 'Dados exportados com sucesso!' 
          : 'Erro ao exportar dados. Tente novamente.'
      });
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      setExportResult({
        success: false,
        message: 'Erro ao exportar dados. Tente novamente.'
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 p-6 space-y-6">
      <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-4">
        Exportar Relatórios de Manutenção
      </h2>
      
      {/* Resultado da exportação */}
      {exportResult && (
        <div className={`p-4 rounded-lg ${exportResult.success ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'} border text-white mb-4`}>
          {exportResult.message}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seleção de veículo */}
        <div>
          <label className="block text-gray-300 mb-2 flex items-center">
            <FaCar className="mr-2 text-blue-400" />
            <span>Veículo</span>
          </label>
          <select
            value={selectedCarId}
            onChange={(e) => setSelectedCarId(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Veículos</option>
            {cars.map(car => (
              <option key={car.id} value={car.id}>
                {car.model} ({car.licensePlate})
              </option>
            ))}
          </select>
        </div>
        
        {/* Tipo de exportação */}
        <div>
          <label className="block text-gray-300 mb-2">Formato de Exportação</label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setExportType('pdf')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg border ${exportType === 'pdf' 
                ? 'bg-blue-500/30 border-blue-500 text-white' 
                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}
            >
              <FaFilePdf />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setExportType('excel')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg border ${exportType === 'excel' 
                ? 'bg-green-500/30 border-green-500 text-white' 
                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}
            >
              <FaFileExcel />
              <span>Excel</span>
            </button>
          </div>
        </div>
        
        {/* Seleção de ano */}
        <div>
          <label className="block text-gray-300 mb-2 flex items-center">
            <FaCalendarAlt className="mr-2 text-blue-400" />
            <span>Ano</span>
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
            <option value="0">Todos os Anos</option>
          </select>
        </div>
        
        {/* Seleção de mês */}
        <div>
          <label className="block text-gray-300 mb-2 flex items-center">
            <FaCalendarAlt className="mr-2 text-blue-400" />
            <span>Mês</span>
          </label>
          <select
            value={selectedMonth !== null ? selectedMonth : ''}
            onChange={(e) => setSelectedMonth(e.target.value === '' ? null : parseInt(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os Meses</option>
            {months.map(month => (
              <option key={month} value={month}>
                {getMonthName(month)}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Botão de exportação */}
      <div className="flex justify-end mt-8">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Exportando...</span>
            </>
          ) : (
            <>
              <FaFileDownload className="mr-2" />
              <span>Exportar Relatório</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
} 