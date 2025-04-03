import React from 'react';
import { Fuel, DollarSign, Activity, Route, Compass as GasPump } from 'lucide-react';
import { MonthlyReport } from '../types';

interface MonthlyStatsProps {
  report: MonthlyReport;
}

export const MonthlyStats: React.FC<MonthlyStatsProps> = ({ report }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-center">
          <div className="p-3 rounded-xl bg-yellow-500 shadow-lg">
            <Fuel className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-blue-100">Média de Consumo</p>
            <p className="text-2xl font-bold text-white mt-1">
              {report.averageConsumption.toFixed(1)} <span className="text-sm">km/l</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-center">
          <div className="p-3 rounded-xl bg-red-500 shadow-lg">
            <DollarSign className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-blue-100">Total Gasto</p>
            <p className="text-2xl font-bold text-white mt-1">
              R$ {report.totalCost.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-center">
          <div className="p-3 rounded-xl bg-purple-500 shadow-lg">
            <Activity className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-blue-100">Custo por km</p>
            <p className="text-2xl font-bold text-white mt-1">
              R$ {report.costPerKm.toFixed(2)} <span className="text-sm">/km</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-center">
          <div className="p-3 rounded-xl bg-blue-500 shadow-lg">
            <Route className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-blue-100">Total Percorrido</p>
            <p className="text-2xl font-bold text-white mt-1">
              {report.totalKm.toFixed(0)} <span className="text-sm">km</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-center">
          <div className="p-3 rounded-xl bg-green-500 shadow-lg">
            <GasPump className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-blue-100">Preço Médio</p>
            <p className="text-2xl font-bold text-white mt-1">
              R$ {report.averageFuelPrice.toFixed(2)} <span className="text-sm">/l</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};