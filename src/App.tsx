import React, { useState, useEffect, useRef } from 'react';
import { FuelForm } from './components/FuelForm';
import { MonthlyStats } from './components/MonthlyStats';
import { ConsumptionChart } from './components/ConsumptionChart';
import { FuelHistory } from './components/FuelHistory';
import { CarForm } from './components/CarForm';
import { CarList } from './components/CarList';
import { LoginForm } from './components/LoginForm';
import { Car, FuelEntry } from './types';
import { calculateMonthlyReport, exportToPDF, exportBatchPDF } from './utils';
import { LayoutDashboard, ChevronLeft, ChevronRight, FileDown, Loader, Users, Building2, MapPin, Settings, UserCircle, FileEdit, Paperclip, Files } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import CityForm from './components/CityForm';
import TechnicianForm from './components/TechnicianForm';
import TechnicianConfigForm from './components/TechnicianConfigForm';
import TechnicianReports from './components/TechnicianReports';
import TechnicianManagementForm from './components/TechnicianManagementForm';
import { Dashboard } from './components/Dashboard';
import { FaSignOutAlt } from 'react-icons/fa';
import Attachments from './components/Attachments';
import { MaintenanceModule } from './components/MaintenanceModule';

function App() {
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<FuelEntry | null>(null);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [entries, setEntries] = useState<FuelEntry[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showCarForm, setShowCarForm] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportingBatch, setExportingBatch] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [techScreen, setTechScreen] = useState<'technicians' | 'cities' | 'reports' | 'config' | 'tech_management'>('technicians');
  const [activeTab, setActiveTab] = useState<'cars' | 'technicians' | 'attachments' | 'maintenance'>('cars');
  const [showDashboard, setShowDashboard] = useState(true);
  const fuelFormRef = useRef<HTMLDivElement>(null);

  // Carregar seleção do veículo do localStorage
  useEffect(() => {
    const savedCarId = localStorage.getItem('selectedCarId');
    if (savedCarId) {
      setSelectedCarId(savedCarId);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchCars();
        fetchEntries();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchCars();
        fetchEntries();
      } else {
        setCars([]);
        setEntries([]);
        setSelectedCarId(null);
        setEditingEntry(null);
        setEditingCar(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching cars:', error);
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
      const savedCarId = localStorage.getItem('selectedCarId');
      if (mappedCars.length > 0 && !savedCarId) {
        setSelectedCarId(mappedCars[0].id);
        localStorage.setItem('selectedCarId', mappedCars[0].id);
      }
      // Se houver seleção salva mas o carro não existe mais, seleciona o primeiro
      else if (savedCarId && !mappedCars.find(car => car.id === savedCarId)) {
        if (mappedCars.length > 0) {
          setSelectedCarId(mappedCars[0].id);
          localStorage.setItem('selectedCarId', mappedCars[0].id);
        } else {
          setSelectedCarId(null);
          localStorage.removeItem('selectedCarId');
        }
      }
    } catch (error) {
      console.error('Error in fetchCars:', error);
    }
  };

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('fuel_entries')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) {
        console.error('Error fetching entries:', error);
        return;
      }
      
      const mappedEntries = data.map(entry => ({
        id: entry.id,
        carId: entry.car_id,
        date: entry.date,
        currentKm: entry.current_km,
        liters: entry.liters,
        totalCost: entry.total_cost
      }));
      
      setEntries(mappedEntries);
    } catch (error) {
      console.error('Error in fetchEntries:', error);
    }
  };

  const handleAddCar = async (car: Car) => {
    const userId = session?.user?.id;
    if (!userId) return;

    try {
      const carData = {
        model: car.model,
        license_plate: car.licensePlate,
        year: car.year,
        ipva_due_date: car.ipvaDueDate,
        ipva_paid: car.ipvaPaid,
        last_oil_change_date: car.lastOilChangeDate,
        last_oil_change_km: car.lastOilChangeKm !== null ? parseInt(car.lastOilChangeKm.toString()) : null
      };

      if (editingCar) {
        const { data, error } = await supabase
          .from('cars')
          .update(carData)
          .eq('id', editingCar.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating car:', error);
          return;
        }

        const updatedCar = {
          id: data.id,
          model: data.model,
          licensePlate: data.license_plate,
          year: data.year,
          createdAt: data.created_at,
          ipvaDueDate: data.ipva_due_date,
          ipvaPaid: data.ipva_paid,
          lastOilChangeDate: data.last_oil_change_date,
          lastOilChangeKm: data.last_oil_change_km
        };

        setCars(cars.map(c => c.id === updatedCar.id ? updatedCar : c));
        setEditingCar(null);
      } else {
        const { data, error } = await supabase
          .from('cars')
          .insert([{
            ...carData,
            user_id: userId
          }])
          .select()
          .single();

        if (error) {
          console.error('Error adding car:', error);
          return;
        }

        const newCar = {
          id: data.id,
          model: data.model,
          licensePlate: data.license_plate,
          year: data.year,
          createdAt: data.created_at,
          ipvaDueDate: data.ipva_due_date,
          ipvaPaid: data.ipva_paid,
          lastOilChangeDate: data.last_oil_change_date,
          lastOilChangeKm: data.last_oil_change_km
        };

        setCars([...cars, newCar]);
        if (!selectedCarId) {
          setSelectedCarId(newCar.id);
          localStorage.setItem('selectedCarId', newCar.id);
        }
      }
      setShowCarForm(false);
    } catch (error) {
      console.error('Error in handleAddCar:', error);
    }
  };

  const handleEditCar = (car: Car) => {
    setEditingCar(car);
    setShowCarForm(true);
  };

  const handleDeleteCar = async (carId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este veículo? Todos os registros de abastecimento relacionados também serão excluídos.')) {
      return;
    }

    try {
      // Primeiro excluir todos os registros de abastecimento relacionados a este veículo
      const { error: entriesError } = await supabase
        .from('fuel_entries')
        .delete()
        .eq('car_id', carId);

      if (entriesError) {
        console.error('Error deleting car fuel entries:', entriesError);
        return;
      }

      // Agora podemos excluir o veículo com segurança
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId);

      if (error) {
        console.error('Error deleting car:', error);
        return;
      }

      setCars(cars.filter(car => car.id !== carId));
      setEntries(entries.filter(entry => entry.carId !== carId));
      if (selectedCarId === carId) {
        const remainingCars = cars.filter(car => car.id !== carId);
        if (remainingCars.length > 0) {
          setSelectedCarId(remainingCars[0].id);
          localStorage.setItem('selectedCarId', remainingCars[0].id);
        } else {
          setSelectedCarId(null);
          localStorage.removeItem('selectedCarId');
        }
      }
    } catch (error) {
      console.error('Error deleting car:', error);
    }
  };

  const handleAddEntry = async (entry: FuelEntry) => {
    if (!selectedCarId || !session?.user?.id) return;

    try {
      if (editingEntry) {
        const { data, error } = await supabase
          .from('fuel_entries')
          .update({
            date: entry.date,
            current_km: entry.currentKm,
            liters: entry.liters,
            total_cost: entry.totalCost
          })
          .eq('id', editingEntry.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating entry:', error);
          return;
        }

        const updatedEntry = {
          id: data.id,
          carId: data.car_id,
          date: data.date,
          currentKm: data.current_km,
          liters: data.liters,
          totalCost: data.total_cost
        };

        setEntries(entries.map(e => e.id === editingEntry.id ? updatedEntry : e));
        setEditingEntry(null);
      } else {
        const { data, error } = await supabase
          .from('fuel_entries')
          .insert([{
            car_id: selectedCarId,
            user_id: session.user.id,
            date: entry.date,
            current_km: entry.currentKm,
            liters: entry.liters,
            total_cost: entry.totalCost
          }])
          .select()
          .single();

        if (error) {
          console.error('Error adding entry:', error);
          return;
        }

        const newEntry = {
          id: data.id,
          carId: data.car_id,
          date: data.date,
          currentKm: data.current_km,
          liters: data.liters,
          totalCost: data.total_cost
        };

        setEntries([...entries, newEntry]);
      }
    } catch (error) {
      console.error('Error in handleAddEntry:', error);
    }
  };

  const handleEditEntry = (entry: FuelEntry) => {
    setEditingEntry(entry);
    setTimeout(() => {
      fuelFormRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este abastecimento?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('fuel_entries')
        .delete()
        .eq('id', entryId);

      if (error) {
        console.error('Error deleting entry:', error);
        return;
      }

      setEntries(entries.filter(e => e.id !== entryId));
    } catch (error) {
      console.error('Error in handleDeleteEntry:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      setCars([]);
      setEntries([]);
      setSelectedCarId(null);
      setEditingEntry(null);
      setEditingCar(null);
      setSession(null);
      localStorage.removeItem('selectedCarId');
      
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error in handleSignOut:', error);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || !selectedCarId) return;
    
    const selectedCar = cars.find(car => car.id === selectedCarId);
    if (!selectedCar) return;
    
    await exportToPDF(reportRef.current, selectedCar.model, selectedMonth);
  };

  const handleBatchExport = async () => {
    if (exportingBatch || cars.length === 0) return;
    
    setExportingBatch(true);
    try {
      await exportBatchPDF(cars, entries, selectedMonth);
    } catch (error) {
      console.error('Error exporting batch reports:', error);
    } finally {
      setExportingBatch(false);
    }
  };

  const handleCarSelection = (carId: string) => {
    setSelectedCarId(carId);
    localStorage.setItem('selectedCarId', carId);
  };

  const filteredEntries = entries.filter(entry => entry.carId === selectedCarId);
  const monthlyReport = calculateMonthlyReport(filteredEntries, selectedMonth);

  const handlePreviousMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => addMonths(prev, 1));
  };

  const selectedCar = cars.find(car => car.id === selectedCarId);

  const handleUpdateCar = (updatedCar: Car) => {
    setCars(cars.map(car => car.id === updatedCar.id ? updatedCar : car));
  };

  const userId = session?.user?.id;

  // Função para lidar com o login bem-sucedido
  const handleLogin = (session: Session) => {
    setSession(session);
    setShowDashboard(true);
    fetchCars();
    fetchEntries();
  };

  // Função para navegar entre módulos
  const handleNavigate = (module: string) => {
    setActiveTab(module as 'cars' | 'technicians' | 'attachments' | 'maintenance');
    setShowDashboard(false);
  };

  // Função para retornar ao dashboard
  const handleReturnToDashboard = () => {
    setShowDashboard(true);
  };

  // Se não houver sessão, mostrar tela de login
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Fundo com gradiente e efeito de blur */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-blue-700 to-purple-800 opacity-80"></div>
        
        {/* Círculos decorativos com animação */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* Grid de efeito */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:30px_30px] opacity-10"></div>
        
        {/* Container do formulário com efeito de vidro */}
        <div className="relative z-10">
          <LoginForm onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  // Se estiver no dashboard
  if (showDashboard) {
    return (
      <Dashboard 
        session={session} 
        onLogout={handleSignOut} 
        onNavigate={handleNavigate}
      />
    );
  }

  // Módulo de Gestão de Cidades (activeTab === 'technicians')
  if (activeTab === 'technicians') {
    return (
      <div className="min-h-screen bg-[#0f172a] relative overflow-hidden">
        {/* Efeito de fundo sutil */}
        <div className="fixed inset-0 pointer-events-none">
          {/* Grade simples */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(56,189,248,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,189,248,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
          
          {/* Círculos de luz reduzidos */}
          <div className="absolute top-0 left-0 w-full h-full opacity-60">
            <div className="absolute top-[5%] left-[15%] w-[30rem] h-[30rem] bg-blue-500/10 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[5%] right-[15%] w-[30rem] h-[30rem] bg-purple-500/10 rounded-full blur-[100px]"></div>
          </div>
        </div>

        {/* Barra superior simplificada */}
        <header className="sticky top-0 z-50 bg-[#0f172a]/90 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Sistema Integrado
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleReturnToDashboard}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
              >
                Tela Inicial
              </button>
              <button
                onClick={() => setActiveTab('cars')}
                className="px-5 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-medium"
              >
                Gestão de Veículos
              </button>
              <button
                onClick={() => setActiveTab('attachments')}
                className="px-5 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-medium flex items-center"
              >
                <Paperclip size={16} className="mr-2" />
                <span>Anexos</span>
              </button>
              <button
                onClick={handleSignOut}
                className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium flex items-center space-x-2"
              >
                <FaSignOutAlt className="mr-2" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white/5 p-6 rounded-xl border border-white/10 backdrop-blur-sm">
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  Gestão de Cidades e Técnicos
                </h1>
                <p className="text-gray-300 mt-1">Configure cidades, ordens de serviço e técnicos no sistema</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTechScreen('technicians')}
                  className={`px-4 py-2 rounded-xl flex items-center transition-all ${
                    techScreen === 'technicians'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  <FileEdit size={18} className="mr-2" />
                  Registros
                </button>
                <button
                  onClick={() => setTechScreen('tech_management')}
                  className={`px-4 py-2 rounded-xl flex items-center transition-all ${
                    techScreen === 'tech_management'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  <Users size={18} className="mr-2" />
                  Técnicos
                </button>
                <button
                  onClick={() => setTechScreen('cities')}
                  className={`px-4 py-2 rounded-xl flex items-center transition-all ${
                    techScreen === 'cities'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  <Building2 size={18} className="mr-2" />
                  Gestão Cidades
                </button>
                <button
                  onClick={() => setTechScreen('reports')}
                  className={`px-4 py-2 rounded-xl flex items-center transition-all ${
                    techScreen === 'reports'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  <FileDown size={18} className="mr-2" />
                  Relatórios
                </button>
                <button
                  onClick={() => setTechScreen('config')}
                  className={`px-4 py-2 rounded-xl flex items-center transition-all ${
                    techScreen === 'config'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  <Settings size={18} className="mr-2" />
                  Configurações
                </button>
              </div>
            </div>

            {/* Componentes específicos para cada tela */}
            {techScreen === 'technicians' && <div className="bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 overflow-hidden"><TechnicianForm userId={userId || ''} /></div>}
            {techScreen === 'tech_management' && <div className="bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 overflow-hidden"><TechnicianManagementForm userId={userId || ''} /></div>}
            {techScreen === 'cities' && <CityForm userId={userId || ''} />}
            {techScreen === 'reports' && <div className="bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 overflow-hidden"><TechnicianReports userId={userId || ''} /></div>}
            {techScreen === 'config' && <div className="bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 overflow-hidden"><TechnicianConfigForm userId={userId || ''} /></div>}
          </div>
        </main>
        
        {/* Rodapé com créditos */}
        <footer className="bg-white/5 backdrop-blur-sm border-t border-white/10 py-3 text-center text-gray-400 text-sm">
          Sistema Desenvolvido Por Rafael Rodrigues
        </footer>
      </div>
    );
  }

  // Módulo de Veículos (activeTab === 'cars')
  if (activeTab === 'cars') {
    return (
      <div className="min-h-screen bg-[#0f172a] relative overflow-hidden">
        {/* Efeito de fundo sutil */}
        <div className="fixed inset-0 pointer-events-none">
          {/* Grade simples */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(56,189,248,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,189,248,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
          
          {/* Círculos de luz reduzidos */}
          <div className="absolute top-0 left-0 w-full h-full opacity-60">
            <div className="absolute top-[5%] left-[15%] w-[30rem] h-[30rem] bg-blue-500/10 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[5%] right-[15%] w-[30rem] h-[30rem] bg-purple-500/10 rounded-full blur-[100px]"></div>
          </div>
        </div>

        {/* Barra superior simplificada */}
        <header className="sticky top-0 z-50 bg-[#0f172a]/90 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Sistema Integrado
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleReturnToDashboard}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
              >
                Tela Inicial
              </button>
              <button
                onClick={() => setActiveTab('technicians')}
                className="px-5 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-medium flex items-center"
              >
                <Building2 className="w-5 h-5 mr-2" />
                Gestão de Cidades
              </button>
              <button
                onClick={() => setActiveTab('attachments')}
                className="px-5 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-medium flex items-center"
              >
                <Paperclip size={16} className="mr-2" />
                <span>Anexos</span>
              </button>
              <button
                onClick={handleSignOut}
                className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium flex items-center space-x-2"
              >
                <FaSignOutAlt className="mr-2" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  Gestão de Veículos
                </h1>
                <p className="text-gray-300 mt-1">Controle e monitoramento de consumo de combustível</p>
              </div>
              <button
                onClick={() => {
                  setShowCarForm(!showCarForm);
                  setEditingCar(null);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium flex items-center"
              >
                {showCarForm ? 'Voltar' : 'Adicionar Veículo'}
              </button>
            </div>

            {showCarForm ? (
              <div className="bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 p-6">
                <CarForm onSubmit={handleAddCar} initialData={editingCar} />
              </div>
            ) : (
              <>
                <div className="bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 p-6">
                  <h2 className="text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-4">
                    Selecione um Veículo
                  </h2>
                  <CarList
                    cars={cars}
                    selectedCarId={selectedCarId}
                    onSelectCar={handleCarSelection}
                    onDeleteCar={handleDeleteCar}
                    onEditCar={handleEditCar}
                    onUpdateCar={handleUpdateCar}
                    entries={entries}
                    setCars={setCars}
                  />
                </div>

                {selectedCarId && (
                  <>
                    <div ref={fuelFormRef} className="bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 p-6">
                      <h2 className="text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-4">
                        {editingEntry ? 'Editar' : 'Novo'} Abastecimento - {selectedCar?.model || ''} ({selectedCar?.licensePlate || ''})
                      </h2>
                      <FuelForm onSubmit={handleAddEntry} initialData={editingEntry} />
                    </div>

                    {filteredEntries.length > 0 && (
                      <>
                        <div ref={reportRef} className="bg-gradient-to-r from-blue-600/80 to-indigo-700/80 backdrop-blur-sm rounded-xl shadow-xl p-8 border border-white/10">
                          <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Relatório Mensal</h2>
                            <div className="flex items-center space-x-4">
                              <button
                                onClick={handlePreviousMonth}
                                className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
                              >
                                <ChevronLeft className="h-6 w-6 text-white" strokeWidth={2.5} />
                              </button>
                              <span className="text-white font-medium text-lg">
                                {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
                              </span>
                              <button
                                onClick={handleNextMonth}
                                className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
                              >
                                <ChevronRight className="h-6 w-6 text-white" strokeWidth={2.5} />
                              </button>
                            </div>
                          </div>
                          <MonthlyStats report={monthlyReport} />
                          <div className="flex justify-end mt-6 space-x-4">
                            <button
                              onClick={handleExportPDF}
                              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium flex items-center"
                            >
                              <FileDown size={18} className="mr-2" />
                              Exportar Relatório
                            </button>
                            <button
                              onClick={handleBatchExport}
                              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium flex items-center"
                              disabled={exportingBatch}
                            >
                              {exportingBatch ? (
                                <>
                                  <Loader size={18} className="mr-2 animate-spin" />
                                  Exportando...
                                </>
                              ) : (
                                <>
                                  <Files size={18} className="mr-2" />
                                  Exportar Todos Veículos
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {filteredEntries.length > 1 && (
                          <div className="bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 p-6">
                            <h2 className="text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-4">
                              Análise de Consumo
                            </h2>
                            <ConsumptionChart entries={filteredEntries} />
                          </div>
                        )}

                        <div className="bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 p-6">
                          <h2 className="text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-4">
                            Histórico de Abastecimentos
                          </h2>
                          <FuelHistory 
                            entries={filteredEntries}
                            onEdit={handleEditEntry}
                            onDelete={handleDeleteEntry}
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </main>
        
        {/* Rodapé com créditos */}
        <footer className="bg-white/5 backdrop-blur-sm border-t border-white/10 py-3 text-center text-gray-400 text-sm">
          Sistema Desenvolvido Por Rafael Rodrigues
        </footer>
      </div>
    );
  }

  // Módulo de Anexos (activeTab === 'attachments')
  if (activeTab === 'attachments') {
    return (
      <div className="min-h-screen bg-[#0f172a] relative overflow-hidden">
        {/* Efeito de fundo sutil */}
        <div className="fixed inset-0 pointer-events-none">
          {/* Grade simples */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(56,189,248,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,189,248,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
          
          {/* Círculos de luz reduzidos */}
          <div className="absolute top-0 left-0 w-full h-full opacity-60">
            <div className="absolute top-[5%] left-[15%] w-[30rem] h-[30rem] bg-blue-500/10 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[5%] right-[15%] w-[30rem] h-[30rem] bg-purple-500/10 rounded-full blur-[100px]"></div>
          </div>
        </div>

        {/* Barra superior simplificada */}
        <header className="sticky top-0 z-50 bg-[#0f172a]/90 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Sistema Integrado
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleReturnToDashboard}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
              >
                Tela Inicial
              </button>
              <button
                onClick={() => setActiveTab('cars')}
                className="px-5 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-medium"
              >
                Gestão de Veículos
              </button>
              <button
                onClick={() => setActiveTab('technicians')}
                className="px-5 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-medium"
              >
                Gestão de Cidades
              </button>
              <button
                onClick={handleSignOut}
                className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium flex items-center space-x-2"
              >
                <FaSignOutAlt className="mr-2" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white/5 p-6 rounded-xl border border-white/10 backdrop-blur-sm">
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  Gestão de Anexos
                </h1>
                <p className="text-gray-300 mt-1">Envie, gerencie e busque por arquivos no sistema</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 overflow-hidden p-6">
              <Attachments />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Módulo de Gastos de Manutenção (activeTab === 'maintenance')
  if (activeTab === 'maintenance') {
    return (
      <div className="min-h-screen bg-[#0f172a] relative overflow-hidden">
        {/* Efeito de fundo sutil */}
        <div className="fixed inset-0 pointer-events-none">
          {/* Grade simples */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(56,189,248,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,189,248,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
          
          {/* Círculos de luz reduzidos */}
          <div className="absolute top-0 left-0 w-full h-full opacity-60">
            <div className="absolute top-[5%] left-[15%] w-[30rem] h-[30rem] bg-blue-500/10 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[5%] right-[15%] w-[30rem] h-[30rem] bg-purple-500/10 rounded-full blur-[100px]"></div>
          </div>
        </div>

        {/* Barra superior simplificada */}
        <header className="sticky top-0 z-50 bg-[#0f172a]/90 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Sistema Integrado
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleReturnToDashboard}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
              >
                Tela Inicial
              </button>
              <button
                onClick={() => setActiveTab('cars')}
                className="px-5 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-medium"
              >
                Gestão de Veículos
              </button>
              <button
                onClick={() => setActiveTab('technicians')}
                className="px-5 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-medium"
              >
                Gestão de Cidades
              </button>
              <button
                onClick={() => setActiveTab('attachments')}
                className="px-5 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-medium flex items-center"
              >
                <Paperclip size={16} className="mr-2" />
                <span>Anexos</span>
              </button>
              <button
                onClick={handleSignOut}
                className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium flex items-center space-x-2"
              >
                <FaSignOutAlt className="mr-2" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white/5 p-6 rounded-xl border border-white/10 backdrop-blur-sm">
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  Gastos de Manutenção
                </h1>
                <p className="text-gray-300 mt-1">Registre e gerencie os gastos com manutenção de veículos</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 overflow-hidden p-6">
              <MaintenanceModule userId={userId || ''} />
            </div>
          </div>
        </main>
        
        {/* Rodapé com créditos */}
        <footer className="bg-white/5 backdrop-blur-sm border-t border-white/10 py-3 text-center text-gray-400 text-sm">
          Sistema Desenvolvido Por Rafael Rodrigues
        </footer>
      </div>
    );
  }

  return null;
}

export default App;