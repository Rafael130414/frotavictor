import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FaTools, FaCalendarAlt, FaExchangeAlt, FaMoneyBillWave, FaTags, FaSortAmountUp, FaSortAmountDown } from 'react-icons/fa';

interface MaintenanceStatsProps {
  userId: string;
  selectedMonth: Date;
}

interface CarMaintenanceStat {
  id: string;
  model: string;
  licensePlate: string;
  totalSpent: number;
  recordCount: number;
}

export function MaintenanceStats({ userId, selectedMonth }: MaintenanceStatsProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mostExpensiveMonth, setMostExpensiveMonth] = useState<CarMaintenanceStat | null>(null);
  const [leastExpensiveMonth, setLeastExpensiveMonth] = useState<CarMaintenanceStat | null>(null);
  const [mostExpensiveYear, setMostExpensiveYear] = useState<CarMaintenanceStat | null>(null);
  const [leastExpensiveYear, setLeastExpensiveYear] = useState<CarMaintenanceStat | null>(null);
  const [totalMonthSpent, setTotalMonthSpent] = useState<number>(0);
  const [totalYearSpent, setTotalYearSpent] = useState<number>(0);

  useEffect(() => {
    if (userId) {
      fetchMaintenanceStats();
    }
  }, [userId, selectedMonth]);

  const fetchMaintenanceStats = async () => {
    try {
      setIsLoading(true);

      // Definir intervalos de datas
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      const yearStart = startOfYear(selectedMonth);
      const yearEnd = endOfYear(selectedMonth);

      const monthStartStr = format(monthStart, 'yyyy-MM-dd');
      const monthEndStr = format(monthEnd, 'yyyy-MM-dd');
      const yearStartStr = format(yearStart, 'yyyy-MM-dd');
      const yearEndStr = format(yearEnd, 'yyyy-MM-dd');

      // Buscar registros de manutenção do mês
      const { data: monthRecords, error: monthError } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('user_id', userId)
        .gte('maintenance_date', monthStartStr)
        .lte('maintenance_date', monthEndStr);

      if (monthError) {
        console.error('Erro ao buscar registros de manutenção do mês:', monthError);
        throw monthError;
      }

      // Buscar registros de manutenção do ano
      const { data: yearRecords, error: yearError } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('user_id', userId)
        .gte('maintenance_date', yearStartStr)
        .lte('maintenance_date', yearEndStr);

      if (yearError) {
        console.error('Erro ao buscar registros de manutenção do ano:', yearError);
        throw yearError;
      }

      // Buscar todos os carros do usuário
      const { data: cars, error: carsError } = await supabase
        .from('cars')
        .select('*');

      if (carsError) {
        console.error('Erro ao buscar carros:', carsError);
        throw carsError;
      }

      // Calcular estatísticas do mês
      const monthStats = calculateStats(monthRecords || [], cars || []);
      setTotalMonthSpent(monthStats.totalSpent);
      setMostExpensiveMonth(monthStats.mostExpensive);
      setLeastExpensiveMonth(monthStats.leastExpensive);

      // Calcular estatísticas do ano
      const yearStats = calculateStats(yearRecords || [], cars || []);
      setTotalYearSpent(yearStats.totalSpent);
      setMostExpensiveYear(yearStats.mostExpensive);
      setLeastExpensiveYear(yearStats.leastExpensive);

    } catch (error) {
      console.error('Erro ao buscar estatísticas de manutenção:', error);
      resetStats();
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (records: any[], cars: any[]) => {
    // Mapear IDs dos carros para seus detalhes
    const carMap = new Map();
    cars.forEach(car => {
      carMap.set(car.id, {
        model: car.model,
        licensePlate: car.license_plate
      });
    });

    // Agrupar registros por carro
    const carStats = new Map<string, { totalSpent: number, recordCount: number }>();
    
    records.forEach(record => {
      const carId = record.car_id;
      const cost = parseFloat(record.cost);
      
      if (!carStats.has(carId)) {
        carStats.set(carId, { totalSpent: 0, recordCount: 0 });
      }
      
      const stat = carStats.get(carId)!;
      stat.totalSpent += cost;
      stat.recordCount += 1;
    });

    // Calcular total gasto
    const totalSpent = records.reduce((sum, record) => sum + parseFloat(record.cost), 0);

    // Encontrar carro mais caro e mais barato
    let mostExpensive: CarMaintenanceStat | null = null;
    let leastExpensive: CarMaintenanceStat | null = null;
    
    carStats.forEach((stat, carId) => {
      // Só considera veículos com despesas no período
      if (stat.totalSpent <= 0) return;
      
      const car = carMap.get(carId);
      if (!car) return; // Pula se o carro não existe mais
      
      const carStat: CarMaintenanceStat = {
        id: carId,
        model: car.model,
        licensePlate: car.licensePlate,
        totalSpent: stat.totalSpent,
        recordCount: stat.recordCount
      };

      if (!mostExpensive || stat.totalSpent > mostExpensive.totalSpent) {
        mostExpensive = carStat;
      }

      if (!leastExpensive || stat.totalSpent < leastExpensive.totalSpent) {
        leastExpensive = carStat;
      }
    });

    return {
      totalSpent,
      mostExpensive,
      leastExpensive
    };
  };

  const resetStats = () => {
    setMostExpensiveMonth(null);
    setLeastExpensiveMonth(null);
    setMostExpensiveYear(null);
    setLeastExpensiveYear(null);
    setTotalMonthSpent(0);
    setTotalYearSpent(0);
  };

  const StatCard = ({ title, value, type, icon }: { title: string, value: string, type: string, icon: React.ReactNode }) => (
    <div className="bg-white/5 rounded-lg overflow-hidden backdrop-blur-sm border border-white/10">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-gradient-to-tr from-purple-400 to-blue-500 rounded-full p-3">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-300 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-xl font-semibold text-white">{value}</div>
              <div className="ml-2 text-sm text-gray-400">{type}</div>
            </dd>
          </div>
        </div>
      </div>
    </div>
  );

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    });
  };

  const monthName = format(selectedMonth, 'MMMM', { locale: ptBR });
  const year = format(selectedMonth, 'yyyy');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <StatCard
          title={`Veículo com maior gasto em ${monthName}`}
          value={mostExpensiveMonth ? `${mostExpensiveMonth.model} (${mostExpensiveMonth.licensePlate})` : 'Sem dados'}
          type={mostExpensiveMonth ? formatCurrency(mostExpensiveMonth.totalSpent) : ''}
          icon={<FaSortAmountUp className="h-5 w-5 text-white" />}
        />
        <StatCard
          title={`Veículo com menor gasto em ${monthName}`}
          value={leastExpensiveMonth ? `${leastExpensiveMonth.model} (${leastExpensiveMonth.licensePlate})` : 'Sem dados'}
          type={leastExpensiveMonth ? formatCurrency(leastExpensiveMonth.totalSpent) : ''}
          icon={<FaSortAmountDown className="h-5 w-5 text-white" />}
        />
        <StatCard
          title={`Veículo com maior gasto em ${year}`}
          value={mostExpensiveYear ? `${mostExpensiveYear.model} (${mostExpensiveYear.licensePlate})` : 'Sem dados'}
          type={mostExpensiveYear ? formatCurrency(mostExpensiveYear.totalSpent) : ''}
          icon={<FaMoneyBillWave className="h-5 w-5 text-white" />}
        />
        <StatCard
          title={`Veículo com menor gasto em ${year}`}
          value={leastExpensiveYear ? `${leastExpensiveYear.model} (${leastExpensiveYear.licensePlate})` : 'Sem dados'}
          type={leastExpensiveYear ? formatCurrency(leastExpensiveYear.totalSpent) : ''}
          icon={<FaTags className="h-5 w-5 text-white" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <StatCard
          title={`Total gasto em ${monthName}`}
          value={formatCurrency(totalMonthSpent)}
          type={`Mês atual`}
          icon={<FaCalendarAlt className="h-5 w-5 text-white" />}
        />
        <StatCard
          title={`Total gasto em ${year}`}
          value={formatCurrency(totalYearSpent)}
          type={`Ano atual`}
          icon={<FaTools className="h-5 w-5 text-white" />}
        />
      </div>
    </div>
  );
} 