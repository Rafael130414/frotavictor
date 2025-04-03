import React, { useState, useEffect } from 'react';
import { PlusCircle, Save } from 'lucide-react';
import { FuelEntry } from '../types';

interface FuelFormProps {
  onSubmit: (entry: FuelEntry) => void;
  initialData?: FuelEntry | null;
}

export const FuelForm: React.FC<FuelFormProps> = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    currentKm: '',
    liters: '',
    totalCost: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        currentKm: initialData.currentKm.toString(),
        liters: initialData.liters.toString(),
        totalCost: initialData.totalCost.toString(),
        date: initialData.date.split('T')[0],
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      id: initialData?.id || Date.now().toString(),
      date: formData.date,
      currentKm: Number(formData.currentKm),
      liters: Number(formData.liters),
      totalCost: Number(formData.totalCost),
      carId: initialData?.carId || '',
    });
    
    setFormData({
      currentKm: '',
      liters: '',
      totalCost: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            Quilometragem Atual
          </label>
          <input
            type="number"
            required
            value={formData.currentKm}
            onChange={(e) => setFormData({ ...formData, currentKm: e.target.value })}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: 15000"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            Litros Abastecidos
          </label>
          <input
            type="number"
            required
            step="0.01"
            value={formData.liters}
            onChange={(e) => setFormData({ ...formData, liters: e.target.value })}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: 40"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            Valor Total (R$)
          </label>
          <input
            type="number"
            required
            step="0.01"
            value={formData.totalCost}
            onChange={(e) => setFormData({ ...formData, totalCost: e.target.value })}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: 240.00"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            Data
          </label>
          <input
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
          />
        </div>
      </div>
      <button
        type="submit"
        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 shadow-md hover:-translate-y-0.5 font-medium"
      >
        {initialData ? (
          <>
            <Save className="w-5 h-5 mr-2" />
            Atualizar Abastecimento
          </>
        ) : (
          <>
            <PlusCircle className="w-5 h-5 mr-2" />
            Adicionar Abastecimento
          </>
        )}
      </button>
    </form>
  );
};