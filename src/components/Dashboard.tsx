import React, { useState, useEffect, useRef } from 'react';
import { FaHome, FaUser, FaCog, FaSignOutAlt, FaBell, FaEnvelope, FaGasPump, FaCity, FaChartBar, FaCalendarAlt, FaClock, FaClipboardCheck, FaCamera, FaCar, FaMoneyBillWave, FaRoad, FaDollarSign, FaPaperclip, FaFileAlt, FaTools } from 'react-icons/fa';
import { ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MaintenanceStats } from './MaintenanceStats';

interface DashboardProps {
  session: Session | null;
  onLogout: () => void;
  onNavigate: (tab: string) => void;
}

interface VehicleStats {
  id: string;
  model: string;
  licensePlate: string;
  efficiency: number; // km/L
  totalSpent: number; // R$
  totalDistance: number; // km
}

export function Dashboard({ session, onLogout, onNavigate }: DashboardProps) {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [totalCities, setTotalCities] = useState(0);
  const [totalServiceOrders, setTotalServiceOrders] = useState(0);
  const [monthlyConsumption, setMonthlyConsumption] = useState(0);
  const [totalFuelCost, setTotalFuelCost] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userEmail = session?.user?.email || '';
  
  // Estado para mês das estatísticas do sistema
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [isSystemStatsLoading, setIsSystemStatsLoading] = useState(false);
  
  // Estado para mês das estatísticas de veículos
  const [selectedVehicleMonth, setSelectedVehicleMonth] = useState<Date>(new Date());
  const [isVehicleStatsLoading, setIsVehicleStatsLoading] = useState(false);
  
  // Estado para mês das estatísticas de manutenção
  const [selectedMaintenanceMonth, setSelectedMaintenanceMonth] = useState<Date>(new Date());
  
  // Estados para estatísticas de veículos
  const [mostEfficientVehicle, setMostEfficientVehicle] = useState<VehicleStats | null>(null);
  const [mostExpensiveVehicle, setMostExpensiveVehicle] = useState<VehicleStats | null>(null);
  const [mostDrivenVehicle, setMostDrivenVehicle] = useState<VehicleStats | null>(null);

  useEffect(() => {
    // Atualizando hora e data
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR'));
      setCurrentDate(now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    // Buscar dados do sistema e avatar
    fetchSystemStats();
    fetchAvatar();

    return () => clearInterval(interval);
  }, [selectedMonth]);
  
  // Effect separado para estatísticas de veículos
  useEffect(() => {
    if (session) {
      fetchVehicleStats(selectedVehicleMonth);
    }
  }, [selectedVehicleMonth, session]);

  // Função para buscar estatísticas de veículos
  const fetchVehicleStats = async (date: Date) => {
    try {
      setIsVehicleStatsLoading(true);
      const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
      
      console.log(`Buscando dados de veículos de ${startDate} até ${endDate}`);
      
      // Buscar todos os carros
      const { data: cars, error: carsError } = await supabase
        .from('cars')
        .select('*');
        
      if (carsError) {
        console.error('Erro ao buscar carros:', carsError);
        throw carsError;
      }
      
      if (!cars || cars.length === 0) {
        console.log('Nenhum carro encontrado na tabela cars');
        setMostEfficientVehicle(null);
        setMostExpensiveVehicle(null);
        setMostDrivenVehicle(null);
        return;
      }
      
      // Buscar entradas de combustível específicas para o período
      const { data: periodEntries, error: periodEntriesError } = await supabase
        .from('fuel_entries')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
        
      if (periodEntriesError) {
        console.error('Erro ao buscar entradas de combustível para o período:', periodEntriesError);
        throw periodEntriesError;
      }
      
      // Se não tivermos entradas para o período, setamos explicitamente para null
      if (!periodEntries || periodEntries.length === 0) {
        console.log('Nenhuma entrada de combustível encontrada para o período');
        // Definir todos os estados como null para mostrar "Sem dados para o período selecionado"
        setMostEfficientVehicle(null);
        setMostExpensiveVehicle(null);
        setMostDrivenVehicle(null);
        return;
      }
      
      // Processar as entradas encontradas para o período
      processEntriesData(cars, periodEntries, true);
      
    } catch (error) {
      console.error('Erro ao buscar estatísticas de veículos:', error);
      // Em caso de erro, limpa os estados
      setMostEfficientVehicle(null);
      setMostExpensiveVehicle(null);
      setMostDrivenVehicle(null);
    } finally {
      setIsVehicleStatsLoading(false);
    }
  };
  
  // Função auxiliar para processar os dados de entradas de combustível
  const processEntriesData = (cars: any[], entries: any[], isPeriodData: boolean) => {
    // Agrupar por carro - usando o nome correto da coluna car_id
    const entriesByCarId = new Map<string, any[]>();
    
    for (const entry of entries) {
      const carId = entry.car_id;
      if (!carId) continue;
      
      if (!entriesByCarId.has(carId)) {
        entriesByCarId.set(carId, []);
      }
      entriesByCarId.get(carId)?.push(entry);
    }
    
    const vehicleStats: VehicleStats[] = [];
    
    // Calcular estatísticas para cada carro
    for (const car of cars) {
      const carEntries = entriesByCarId.get(car.id) || [];
      if (carEntries.length === 0) continue;
      
      // Ordenar por data crescente (mais antiga primeiro)
      carEntries.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Calcular estatísticas
      let totalDistance = 0;
      let totalLiters = 0;
      let totalSpent = 0;
      
      // Para cálculo de eficiência, precisamos de pelo menos 2 entradas
      if (carEntries.length > 1) {
        // Calculamos a eficiência a partir do segundo registro
        for (let i = 1; i < carEntries.length; i++) {
          // Certifique-se de converter para números antes de calcular a diferença
          const currentKm = parseFloat(carEntries[i].current_km);
          const previousKm = parseFloat(carEntries[i-1].current_km);
          const kmDiff = currentKm - previousKm;
          
          // Usamos o combustível do abastecimento ANTERIOR (que foi o combustível usado para percorrer esta distância)
          const previousLiters = parseFloat(carEntries[i-1].liters);
          
          if (kmDiff > 0 && previousLiters > 0) {
            totalDistance += kmDiff;
            totalLiters += previousLiters;
            console.log(`[${car.model}] Trecho ${i}: ${previousKm} -> ${currentKm} = ${kmDiff}km com ${previousLiters}L`);
          }
        }
      }
      
      // Calcular total gasto - somamos todos os abastecimentos
      totalSpent = carEntries.reduce((sum: number, entry: any) => sum + parseFloat(entry.total_cost), 0);
      
      // Calcular eficiência (km/L) - apenas se tivermos distância e litros válidos
      const efficiency = totalDistance > 0 && totalLiters > 0 ? totalDistance / totalLiters : 0;
      
      console.log(`Carro ${car.model}: Distância=${totalDistance.toFixed(1)}, Litros=${totalLiters.toFixed(1)}, Eficiência=${efficiency.toFixed(2)}`);
      
      // Adicionar às estatísticas - usando os campos corretos do carro
      vehicleStats.push({
        id: car.id,
        model: car.model,
        licensePlate: car.license_plate, 
        efficiency,
        totalSpent,
        totalDistance
      });
    }
    
    if (vehicleStats.length === 0) {
      console.log('Nenhum veículo com estatísticas encontrado');
      setMostEfficientVehicle(null);
      setMostExpensiveVehicle(null);
      setMostDrivenVehicle(null);
      return;
    }
    
    // Se estamos usando dados de outro período (não do período selecionado)
    // definimos todos os veículos como null para mostrar "Sem dados para o período selecionado"
    if (!isPeriodData) {
      console.log('Não há dados para o período selecionado');
      setMostEfficientVehicle(null);
      setMostExpensiveVehicle(null);
      setMostDrivenVehicle(null);
      return;
    }
    
    // Ordenar, garantindo que apenas valores positivos de eficiência são considerados
    const vehiclesWithEfficiency = vehicleStats.filter(v => v.efficiency > 0);
    
    console.log('Veículos com eficiência válida:', vehiclesWithEfficiency.length);
    vehiclesWithEfficiency.forEach(v => {
      console.log(`${v.model}: ${v.efficiency.toFixed(2)} km/L`);
    });
    
    const efficient = vehiclesWithEfficiency.length > 0
      ? [...vehiclesWithEfficiency].sort((a, b) => b.efficiency - a.efficiency)[0]
      : null;
    
    // Encontrar o veículo que mais gastou
    const expensive = [...vehicleStats].sort((a, b) => b.totalSpent - a.totalSpent)[0];
    
    // Encontrar o veículo que mais rodou
    const vehiclesWithDistance = vehicleStats.filter(v => v.totalDistance > 0);
    const driven = vehiclesWithDistance.length > 0
      ? [...vehiclesWithDistance].sort((a, b) => b.totalDistance - a.totalDistance)[0]
      : null;
    
    console.log('Veículo mais eficiente:', efficient?.model || 'Nenhum', efficient?.efficiency.toFixed(2) || '0');
    console.log('Veículo que mais gastou:', expensive?.model || 'Nenhum', expensive?.totalSpent.toFixed(2) || '0');
    console.log('Veículo que mais rodou:', driven?.model || 'Nenhum', driven?.totalDistance.toFixed(0) || '0');
    
    setMostEfficientVehicle(efficient);
    setMostExpensiveVehicle(expensive);
    setMostDrivenVehicle(driven);
  };

  const fetchAvatar = async () => {
    try {
      // Buscar URL do avatar do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', session?.user?.id)
        .single();

      if (userError) throw userError;

      if (userData?.avatar_url) {
        setAvatarUrl(userData.avatar_url);
      }
    } catch (error) {
      console.error('Erro ao buscar avatar:', error);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      // Validar tamanho do arquivo (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 2MB');
      }

      // Validar tipo do arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('O arquivo deve ser uma imagem');
      }

      // Criar nome único para o arquivo com timestamp para evitar cache
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const filePath = `${session?.user?.id}/avatar-${timestamp}.${fileExt}`;

      // Remover avatar antigo se existir
      try {
        const { data: existingFiles } = await supabase.storage
          .from('avatars')
          .list(session?.user?.id || '');

        if (existingFiles && existingFiles.length > 0) {
          await supabase.storage
            .from('avatars')
            .remove(existingFiles.map(f => `${session?.user?.id}/${f.name}`));
        }
      } catch (error) {
        console.error('Erro ao tentar remover avatar antigo:', error);
      }

      // Upload do novo arquivo
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública com parâmetro de versão para evitar cache
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const urlWithVersion = `${publicUrl}?v=${timestamp}`;

      // Atualizar URL no banco de dados
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: urlWithVersion })
        .eq('id', session?.user?.id);

      if (updateError) throw updateError;

      // Atualizar URL no estado
      setAvatarUrl(urlWithVersion);
      
      alert('Foto de perfil atualizada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer upload do avatar:', error);
      alert(error.message || 'Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Atualizar o componente de exibição da imagem para forçar atualização
  const ImageComponent = () => {
    if (!avatarUrl) {
      return <FaUser size={20} className="text-blue-400" />;
    }

    return (
      <img 
        src={avatarUrl} 
        alt="Avatar" 
        className="w-full h-full object-cover"
        key={avatarUrl} // Força o React a recriar o componente
      />
    );
  };

  const fetchSystemStats = async () => {
    try {
      setIsSystemStatsLoading(true);
      // Buscar total de cidades
      const { data: citiesData, error: citiesError } = await supabase
        .from('cities')
        .select('*');

      if (!citiesError && citiesData) {
        setTotalCities(citiesData.length);
      }

      // Buscar total de O.S. do mês atual
      const startDate = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');

      const { data: techniciansData, error: techniciansError } = await supabase
        .from('technicians')
        .select('service_orders')
        .gte('date', startDate)
        .lte('date', endDate);

      if (!techniciansError && techniciansData) {
        const totalOS = techniciansData.reduce((acc, curr) => acc + (curr.service_orders || 0), 0);
        setTotalServiceOrders(totalOS);
      }

      // Buscar consumo mensal e total gasto em combustível
      const { data: fuelData, error: fuelError } = await supabase
        .from('fuel_entries')
        .select('liters, total_cost')
        .gte('date', startDate)
        .lte('date', endDate);

      if (!fuelError && fuelData) {
        const totalLiters = fuelData.reduce((acc, curr) => acc + (curr.liters || 0), 0);
        const totalCost = fuelData.reduce((acc, curr) => acc + (curr.total_cost || 0), 0);
        setMonthlyConsumption(totalLiters);
        setTotalFuelCost(totalCost);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setIsSystemStatsLoading(false);
    }
  };

  // Funções para navegar entre meses - estatísticas do sistema
  const goToPreviousMonth = () => {
    setSelectedMonth(prevMonth => subMonths(prevMonth, 1));
  };

  const goToNextMonth = () => {
    setSelectedMonth(prevMonth => addMonths(prevMonth, 1));
  };
  
  // Funções para navegar entre meses - estatísticas de veículos
  const goToPreviousVehicleMonth = () => {
    setSelectedVehicleMonth(prevMonth => subMonths(prevMonth, 1));
  };

  const goToNextVehicleMonth = () => {
    setSelectedVehicleMonth(prevMonth => addMonths(prevMonth, 1));
  };

  // Funções para navegar pelos meses nas estatísticas de manutenção
  const goToPreviousMaintenanceMonth = () => {
    setSelectedMaintenanceMonth(prevMonth => subMonths(prevMonth, 1));
  };
  
  const goToNextMaintenanceMonth = () => {
    setSelectedMaintenanceMonth(nextMonth => addMonths(nextMonth, 1));
  };

  const menuItems = [
    { 
      icon: FaHome, 
      label: 'Início', 
      color: 'from-blue-500 to-blue-600', 
      description: 'Painel principal',
      onClick: () => {}
    },
    { 
      icon: FaGasPump, 
      label: 'Controle de Combustível', 
      color: 'from-green-500 to-green-600', 
      description: 'Gerenciar abastecimentos',
      onClick: () => onNavigate('cars')
    },
    { 
      icon: FaMoneyBillWave, 
      label: 'Gastos de Manutenção', 
      color: 'from-red-500 to-red-600', 
      description: 'Registrar manutenções',
      onClick: () => onNavigate('maintenance')
    },
    { 
      icon: FaFileAlt, 
      label: 'Relatórios de Veículos', 
      color: 'from-indigo-500 to-indigo-600', 
      description: 'Exportação de relatórios',
      onClick: () => onNavigate('cars')
    },
    { 
      icon: FaCity, 
      label: 'Gestão de Cidades', 
      color: 'from-purple-500 to-purple-600', 
      description: 'Administração municipal',
      onClick: () => onNavigate('technicians')
    },
    { 
      icon: FaPaperclip, 
      label: 'Anexos', 
      color: 'from-amber-500 to-amber-600', 
      description: 'Gestão de arquivos',
      onClick: () => onNavigate('attachments')
    },
    { 
      icon: FaCog, 
      label: 'Configurações', 
      color: 'from-gray-500 to-gray-600', 
      description: 'Ajustes do sistema',
      onClick: () => {}
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] relative overflow-hidden">
      {/* Fundo simplificado com menos efeitos */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grade simples */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(56,189,248,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,189,248,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
        
        {/* Círculos de luz reduzidos */}
        <div className="absolute top-0 left-0 w-full h-full opacity-60">
          <div className="absolute top-[5%] left-[15%] w-[30rem] h-[30rem] bg-blue-500/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[5%] right-[15%] w-[30rem] h-[30rem] bg-purple-500/10 rounded-full blur-[100px]"></div>
        </div>
      </div>

      {/* Barra superior simplificada */}
      <header className="sticky top-0 z-50 bg-[#0f172a]/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 py-2">
              Sistema de Controller
            </h1>
            <div className="flex items-center space-x-2 ml-4 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
              <FaCalendarAlt className="text-blue-400" />
              <span className="text-sm text-gray-300 font-medium">{currentDate}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
              <FaClock className="text-blue-400" />
              <span className="text-lg font-medium text-gray-300">{currentTime}</span>
            </div>
            <div className="flex items-center space-x-3 ml-4">
              <div 
                onClick={handleAvatarClick}
                className="relative w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-0.5 cursor-pointer group"
              >
                <div className="w-full h-full bg-[#0f172a] rounded-xl flex items-center justify-center overflow-hidden">
                  <ImageComponent />
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
              <span className="text-sm font-medium text-gray-300">{userEmail}</span>
            </div>
            <button
              onClick={onLogout}
              className="ml-4 flex items-center space-x-2 px-6 py-3 text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:shadow-lg"
            >
              <FaSignOutAlt />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo principal simplificado */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Área de boas-vindas */}
        <div className="bg-white/5 rounded-2xl p-10 relative overflow-hidden mb-12 border border-white/10">
          <div className="relative">
            <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-6">Bem-vindo ao Sistema de Controller!</h2>
            <p className="text-gray-300 text-xl leading-relaxed">
              Este é seu painel de controle principal. Aqui você encontrará todas as ferramentas necessárias para gerenciar combustível, cidades e outras configurações do sistema.
              Explore os diferentes módulos clicando nos cards abaixo.
            </p>
          </div>
        </div>

        {/* Cards de menu principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {menuItems.map((item, index) => (
            <div
              key={index}
              onClick={item.onClick}
              className="group relative bg-white/5 rounded-2xl shadow-lg border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${item.color} text-white`}>
                    <item.icon size={28} />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-300 group-hover:text-blue-400 transition-colors">
                    {item.label}
                  </h2>
                </div>
                <p className="text-base text-gray-400 group-hover:text-gray-300 transition-colors">
                  {item.description}
                </p>
              </div>
              <div className={`h-1 w-full bg-gradient-to-r ${item.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
            </div>
          ))}
        </div>

        {/* Estatísticas do Sistema */}
        <div className="mt-12 bg-white/5 rounded-2xl p-10 relative overflow-hidden border border-white/10">
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Estatísticas do Sistema
              </h3>
              
              {/* Seletor de mês */}
              <div className="flex items-center space-x-4 bg-white/5 p-3 rounded-xl border border-white/10">
                <button 
                  onClick={goToPreviousMonth}
                  className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
                  disabled={isSystemStatsLoading}
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-300 font-medium">
                    {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
                  </span>
                  {isSystemStatsLoading && (
                    <Loader size={18} className="text-blue-400 animate-spin" />
                  )}
                </div>
                <button 
                  onClick={goToNextMonth}
                  className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
                  disabled={isSystemStatsLoading}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            
            {isSystemStatsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center space-y-4">
                  <Loader size={40} className="text-blue-400 animate-spin" />
                  <p className="text-gray-300">Carregando estatísticas...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="flex items-center space-x-6 p-8 bg-white/5 rounded-2xl border border-white/10">
                  <div className="p-5 bg-[#0f172a] rounded-xl shadow-md">
                    <FaCity size={32} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-gray-400 mb-1">Total de Cidades</p>
                    <p className="text-4xl font-bold text-green-400">{totalCities}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6 p-8 bg-white/5 rounded-2xl border border-white/10">
                  <div className="p-5 bg-[#0f172a] rounded-xl shadow-md">
                    <FaGasPump size={32} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-gray-400 mb-1">Consumo Mensal</p>
                    <p className="text-4xl font-bold text-blue-400">{monthlyConsumption.toFixed(0)}L</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6 p-8 bg-white/5 rounded-2xl border border-white/10">
                  <div className="p-5 bg-[#0f172a] rounded-xl shadow-md">
                    <FaClipboardCheck size={32} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-gray-400 mb-1">O.S. Feitas</p>
                    <p className="text-4xl font-bold text-purple-400">{totalServiceOrders}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6 p-8 bg-white/5 rounded-2xl border border-white/10">
                  <div className="p-5 bg-[#0f172a] rounded-xl shadow-md">
                    <FaDollarSign size={32} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-gray-400 mb-1">Gasto em Combustível</p>
                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-yellow-400">R$</span>
                      <span className="text-2xl font-bold text-yellow-400">{totalFuelCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Estatísticas de Veículos */}
        <div className="mt-12 bg-white/5 rounded-2xl p-10 relative overflow-hidden border border-white/10">
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Estatísticas de Veículos
              </h3>
              
              {/* Seletor de mês para veículos */}
              <div className="flex items-center space-x-4 bg-white/5 p-3 rounded-xl border border-white/10">
                <button 
                  onClick={goToPreviousVehicleMonth}
                  className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
                  disabled={isVehicleStatsLoading}
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-300 font-medium">
                    {format(selectedVehicleMonth, 'MMMM yyyy', { locale: ptBR })}
                  </span>
                  {isVehicleStatsLoading && (
                    <Loader size={18} className="text-blue-400 animate-spin" />
                  )}
                </div>
                <button 
                  onClick={goToNextVehicleMonth}
                  className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
                  disabled={isVehicleStatsLoading}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            
            {isVehicleStatsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center space-y-4">
                  <Loader size={40} className="text-blue-400 animate-spin" />
                  <p className="text-gray-300">Carregando estatísticas de veículos...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Card: Veículo Mais Econômico */}
                <div className="flex flex-col p-8 bg-white/5 rounded-2xl border border-white/10 h-full">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="p-5 bg-[#0f172a] rounded-xl shadow-md">
                      <FaCar size={32} className="text-green-400" />
                    </div>
                    <h4 className="text-xl font-semibold text-green-400">Veículo Mais Econômico</h4>
                  </div>
                  
                  {mostEfficientVehicle ? (
                    <div className="flex-1 flex flex-col">
                      <p className="text-xl font-bold text-gray-300 mb-1">{mostEfficientVehicle.model}</p>
                      <p className="text-sm text-gray-400 mb-4">{mostEfficientVehicle.licensePlate}</p>
                      <div className="mt-auto">
                        <p className="text-base font-medium text-gray-400">Eficiência</p>
                        <p className="text-4xl font-bold text-green-400">
                          {mostEfficientVehicle.efficiency.toFixed(1)} <span className="text-lg">km/L</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-gray-400 text-center">Sem dados para o período selecionado</p>
                    </div>
                  )}
                </div>
                
                {/* Card: Veículo Que Mais Gastou */}
                <div className="flex flex-col p-8 bg-white/5 rounded-2xl border border-white/10 h-full">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="p-5 bg-[#0f172a] rounded-xl shadow-md">
                      <FaMoneyBillWave size={32} className="text-red-400" />
                    </div>
                    <h4 className="text-xl font-semibold text-red-400">Veículo Que Mais Gastou</h4>
                  </div>
                  
                  {mostExpensiveVehicle ? (
                    <div className="flex-1 flex flex-col">
                      <p className="text-xl font-bold text-gray-300 mb-1">{mostExpensiveVehicle.model}</p>
                      <p className="text-sm text-gray-400 mb-4">{mostExpensiveVehicle.licensePlate}</p>
                      <div className="mt-auto">
                        <p className="text-base font-medium text-gray-400">Total Gasto</p>
                        <p className="text-4xl font-bold text-red-400">
                          R$ {mostExpensiveVehicle.totalSpent.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-gray-400 text-center">Sem dados para o período selecionado</p>
                    </div>
                  )}
                </div>
                
                {/* Card: Veículo Que Mais Rodou */}
                <div className="flex flex-col p-8 bg-white/5 rounded-2xl border border-white/10 h-full">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="p-5 bg-[#0f172a] rounded-xl shadow-md">
                      <FaRoad size={32} className="text-blue-400" />
                    </div>
                    <h4 className="text-xl font-semibold text-blue-400">Veículo Que Mais Rodou</h4>
                  </div>
                  
                  {mostDrivenVehicle ? (
                    <div className="flex-1 flex flex-col">
                      <p className="text-xl font-bold text-gray-300 mb-1">{mostDrivenVehicle.model}</p>
                      <p className="text-sm text-gray-400 mb-4">{mostDrivenVehicle.licensePlate}</p>
                      <div className="mt-auto">
                        <p className="text-base font-medium text-gray-400">Distância Percorrida</p>
                        <p className="text-4xl font-bold text-blue-400">
                          {mostDrivenVehicle.totalDistance.toFixed(0)} <span className="text-lg">km</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-gray-400 text-center">Sem dados para o período selecionado</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Estatísticas de Manutenção */}
        <div className="mt-12 bg-white/5 rounded-2xl p-10 relative overflow-hidden border border-white/10">
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-400">
                Estatísticas de Manutenção
              </h3>
              
              {/* Seletor de mês para manutenção */}
              <div className="flex items-center space-x-4 bg-white/5 p-3 rounded-xl border border-white/10">
                <button 
                  onClick={goToPreviousMaintenanceMonth}
                  className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-300 font-medium">
                    {format(selectedMaintenanceMonth, 'MMMM yyyy', { locale: ptBR })}
                  </span>
                </div>
                <button 
                  onClick={goToNextMaintenanceMonth}
                  className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            
            <MaintenanceStats 
              userId={session?.user?.id || ''} 
              selectedMonth={selectedMaintenanceMonth} 
            />
          </div>
        </div>

      </main>
    </div>
  );
} 