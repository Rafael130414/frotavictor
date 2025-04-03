import React, { useState, useRef, useEffect } from 'react';
import { PlusCircle, Calendar } from 'lucide-react';
import { Car } from '../types';
import { MonthYearPicker } from './MonthYearPicker';

interface CarFormProps {
  onSubmit: (car: Car) => void;
  initialData?: Car | null;
}

export const CarForm: React.FC<CarFormProps> = ({ onSubmit, initialData }) => {
  const formatIpvaDate = (isoDate: string) => {
    if (!isoDate) return '';
    try {
      // Pega a data ISO e extrai mês e ano diretamente da string
      const [year, month] = isoDate.split('-');
      return `${month}/${year}`;
    } catch {
      return '';
    }
  };

  const [formData, setFormData] = useState({
    model: initialData?.model || '',
    licensePlate: initialData?.licensePlate || '',
    year: initialData?.year || new Date().getFullYear(),
    ipvaDueDate: initialData?.ipvaDueDate ? formatIpvaDate(initialData.ipvaDueDate) : '',
    ipvaPaid: initialData?.ipvaPaid || false,
    lastOilChangeDate: initialData?.lastOilChangeDate || '',
    lastOilChangeKm: initialData?.lastOilChangeKm || '',
  });

  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Converter a data do formato MM/YYYY para ISO string se existir
    const formattedData = {
      ...formData,
      ipvaDueDate: formData.ipvaDueDate ? convertToISODate(formData.ipvaDueDate) : null,
      // Garantir que lastOilChangeKm seja número válido ou null
      lastOilChangeKm: formData.lastOilChangeKm ? parseInt(formData.lastOilChangeKm.toString()) : null,
      // Garantir que lastOilChangeDate seja string válida ou null
      lastOilChangeDate: formData.lastOilChangeDate || null
    };

    console.log('Submitting data:', formattedData); // Para debug

    onSubmit({
      id: initialData?.id || Date.now().toString(),
      ...formattedData,
      createdAt: initialData?.createdAt || new Date().toISOString(),
    });

    if (!initialData) {
      setFormData({
        model: '',
        licensePlate: '',
        year: new Date().getFullYear(),
        ipvaDueDate: '',
        ipvaPaid: false,
        lastOilChangeDate: '',
        lastOilChangeKm: '',
      });
    }
  };

  const convertToISODate = (dateString: string) => {
    if (!dateString) return '';
    const [month, year] = dateString.split('/');
    // Não precisa criar objeto Date, apenas formata a string
    return `${year}-${month.padStart(2, '0')}-01`;
  };

  const handleDateSelect = (date: Date) => {
    // Adiciona 1 ao mês porque getMonth() retorna 0-11
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const formattedDate = `${month}/${year}`;
    console.log('Data selecionada:', date);
    console.log('Mês formatado:', month);
    console.log('Ano formatado:', year);
    console.log('Data final formatada:', formattedDate);
    setFormData({ ...formData, ipvaDueDate: formattedDate });
    setShowPicker(false);
  };

  const handleIpvaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Permite campo vazio ou formato MM/YYYY
    if (value === '' || /^(\d{0,2}\/?\d{0,4})$/.test(value)) {
      // Formata automaticamente adicionando a barra
      let formattedValue = value;
      if (value.length === 2 && !value.includes('/')) {
        formattedValue = value + '/';
      }
      setFormData({ ...formData, ipvaDueDate: formattedValue });
    }
  };

  const handleClearDate = () => {
    setFormData({ ...formData, ipvaDueDate: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
        {initialData ? 'Editar Veículo' : 'Novo Veículo'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            Modelo
          </label>
          <input
            type="text"
            required
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Fiat Uno"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            Placa
          </label>
          <input
            type="text"
            required
            value={formData.licensePlate}
            onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: ABC1234"
            maxLength={7}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            Ano
          </label>
          <input
            type="number"
            required
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min={1900}
            max={new Date().getFullYear() + 1}
          />
        </div>
        <div className="space-y-2 relative" ref={pickerRef}>
          <label className="block text-sm font-medium text-gray-200">
            Vencimento do IPVA (opcional)
          </label>
          <div className="relative flex space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={formData.ipvaDueDate}
                onChange={handleIpvaChange}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="MM/YYYY"
              />
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-500 transition-colors"
              >
                <Calendar className="w-5 h-5" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleClearDate}
              className="px-4 py-2.5 text-sm font-medium text-gray-200 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              Limpar Data
            </button>
            {showPicker && (
              <MonthYearPicker
                value={formData.ipvaDueDate ? new Date(convertToISODate(formData.ipvaDueDate)) : new Date()}
                onChange={handleDateSelect}
                onClose={() => setShowPicker(false)}
              />
            )}
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            Data da Última Troca de Óleo
          </label>
          <input
            type="date"
            value={formData.lastOilChangeDate || ''}
            onChange={(e) => setFormData({ ...formData, lastOilChangeDate: e.target.value })}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            Quilometragem da Última Troca
          </label>
          <input
            type="number"
            value={formData.lastOilChangeKm || ''}
            onChange={(e) => setFormData({ ...formData, lastOilChangeKm: parseInt(e.target.value) })}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      <button
        type="submit"
        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 shadow-md hover:-translate-y-0.5 font-medium"
      >
        <PlusCircle className="w-5 h-5 mr-2" />
        {initialData ? 'Salvar Alterações' : 'Adicionar Veículo'}
      </button>
    </form>
  );
};