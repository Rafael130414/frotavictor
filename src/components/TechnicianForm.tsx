import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Technician, City, TechnicianConfig } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Save, Trash2, PlusCircle, Pencil, X, FileEdit, BarChart3, Calendar } from 'lucide-react';

interface TechnicianWithCity extends Technician {
  cities?: {
    name: string;
  };
}

interface TechnicianListItem {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

interface TechnicianFormProps {
  userId: string;
}

// Lista de nomes de técnicos para fallback
const DEFAULT_TECHNICIAN_NAMES = [
  'Técnico 1',
  'Técnico 2',
  'Técnico 3',
  'Técnico 4',
  'Técnico 5',
];

export default function TechnicianForm({ userId }: TechnicianFormProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianWithCity[]>([]);
  const [technicianList, setTechnicianList] = useState<TechnicianListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [serviceOrderValue, setServiceOrderValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Formulário para adição/edição de técnico
  const [formData, setFormData] = useState({
    name: '',
    cityId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    foodExpense: '',
    fuelExpense: '',
    accommodationExpense: '',
    otherExpense: '',
    serviceOrders: ''
  });

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchCities();
    fetchTechnicians();
    fetchTechnicianList();
    fetchConfig();
  }, [userId]);

  // Buscar lista de técnicos cadastrados
  async function fetchTechnicianList() {
    try {
      const { data, error } = await supabase
        .from('technician_list')
        .select('*')
        .order('name');

      if (error) throw error;
      setTechnicianList(data || []);
      
      // Se tiver técnicos e o nome ainda não foi definido, selecionar o primeiro
      if (data && data.length > 0 && !formData.name) {
        setFormData(prev => ({ ...prev, name: data[0].name }));
      }
    } catch (error) {
      console.error('Erro ao buscar lista de técnicos:', error);
    }
  }

  // Buscar cidades do usuário atual
  async function fetchCities() {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name');

      if (error) throw error;
      setCities(data || []);
      
      // Definir a primeira cidade como padrão se existir
      if (data && data.length > 0 && !formData.cityId) {
        setFormData(prev => ({ ...prev, cityId: data[0].id }));
      }
    } catch (error) {
      console.error('Erro ao buscar cidades:', error);
      setError('Falha ao carregar cidades. Tente novamente.');
    }
  }

  // Buscar técnicos do usuário atual
  async function fetchTechnicians() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('technicians')
        .select('*, cities(name)')
        .order('date', { ascending: false });

      if (error) throw error;
      
      setTechnicians(data || []);
    } catch (error) {
      console.error('Erro ao buscar técnicos:', error);
      setError('Falha ao carregar registros de técnicos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  // Buscar configuração de valor de ordem de serviço
  async function fetchConfig() {
    try {
      const { data, error } = await supabase
        .from('technician_configs')
        .select('service_order_value')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setServiceOrderValue(data.service_order_value);
      }
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
    }
  }

  // Atualizar dados do formulário
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  // Iniciar edição de um registro
  function startEditing(technician: TechnicianWithCity) {
    setIsEditing(true);
    setEditingId(technician.id);
    
    // Converter de underscore para camelCase para o formulário
    setFormData({
      name: technician.name,
      cityId: technician.city_id || '',
      date: technician.date,
      foodExpense: technician.food_expense.toString(),
      fuelExpense: technician.fuel_expense.toString(),
      accommodationExpense: technician.accommodation_expense.toString(),
      otherExpense: technician.other_expense.toString(),
      serviceOrders: technician.service_orders.toString()
    });
    
    // Rolar para o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  // Cancelar edição
  function cancelEditing() {
    setIsEditing(false);
    setEditingId(null);
    
    // Resetar o formulário
    setFormData({
      name: '',
      cityId: cities.length > 0 ? cities[0].id : '',
      date: format(new Date(), 'yyyy-MM-dd'),
      foodExpense: '',
      fuelExpense: '',
      accommodationExpense: '',
      otherExpense: '',
      serviceOrders: ''
    });
  }

  // Adicionar ou atualizar registro de técnico
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Ajuste para garantir que a data seja tratada corretamente sem problemas de fuso horário
      // Construir uma nova data a partir das partes da data (ano, mês, dia) para evitar problemas de UTC
      const dateStr = formData.date; // formato: yyyy-MM-dd
      const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
      
      // Criar uma data com horário ao meio-dia para evitar problemas de fuso horário
      // O mês em JavaScript é baseado em zero (janeiro = 0, dezembro = 11)
      const adjustedDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      const formattedDate = format(adjustedDate, 'yyyy-MM-dd');

      const technicianData = {
        name: formData.name,
        city_id: formData.cityId || null,
        date: formattedDate,
        food_expense: parseFloat(formData.foodExpense) || 0,
        fuel_expense: parseFloat(formData.fuelExpense) || 0,
        accommodation_expense: parseFloat(formData.accommodationExpense) || 0,
        other_expense: parseFloat(formData.otherExpense) || 0,
        service_orders: parseInt(formData.serviceOrders) || 0,
        user_id: userId
      };

      let result;
      
      if (isEditing && editingId) {
        // Atualizar registro existente
        result = await supabase
          .from('technicians')
          .update(technicianData)
          .eq('id', editingId)
          .select();
      } else {
        // Adicionar novo registro
        result = await supabase
          .from('technicians')
          .insert([technicianData])
          .select();
      }

      if (result.error) throw result.error;

      // Resetar campos do formulário (exceto nome e cidade)
      setFormData(prev => ({
        ...prev,
        date: format(new Date(), 'yyyy-MM-dd'),
        foodExpense: '',
        fuelExpense: '',
        accommodationExpense: '',
        otherExpense: '',
        serviceOrders: ''
      }));
      
      // Limpar modo de edição
      setIsEditing(false);
      setEditingId(null);
      
      // Atualizar lista de técnicos
      await fetchTechnicians();
      
      setSuccess(true);
      // Esconder mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar registro:', error);
      setError('Falha ao salvar registro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  // Excluir registro de técnico
  async function deleteTechnician(technicianId: string) {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('technicians')
        .delete()
        .eq('id', technicianId);

      if (error) throw error;

      // Atualizar lista de técnicos
      setTechnicians(technicians.filter(tech => tech.id !== technicianId));
    } catch (error) {
      console.error('Erro ao excluir registro:', error);
      setError('Falha ao excluir registro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  // Calcular o total de despesas de um técnico
  function calculateTotalExpenses(technician: TechnicianWithCity): number {
    return (
      technician.food_expense +
      technician.fuel_expense +
      technician.accommodation_expense +
      technician.other_expense
    );
  }

  // Calcular a receita de um técnico
  function calculateRevenue(technician: TechnicianWithCity): number {
    // Verificar se o valor da ordem de serviço é válido
    if (!serviceOrderValue || isNaN(serviceOrderValue)) {
      return 0;
    }
    
    // Calcular a receita multiplicando o número de ordens pelo valor unitário
    const revenue = technician.service_orders * serviceOrderValue;
    return revenue;
  }

  // Formatar data para exibição
  function formatDate(dateString: string): string {
    try {
      // Garantir que a data seja tratada corretamente ao exibir
      const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
      // Usar o construtor Date com ano, mês (baseado em 0), dia para evitar problemas de fuso horário
      const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  }

  return (
    <div className="p-6 bg-[#0f172a] rounded-xl border border-white/10 relative overflow-hidden">
      {/* Efeito de fundo sutil */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(56,189,248,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,189,248,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="absolute top-[10%] right-[10%] w-[15rem] h-[15rem] bg-blue-500/10 rounded-full blur-[50px]"></div>
        <div className="absolute bottom-[10%] left-[10%] w-[15rem] h-[15rem] bg-purple-500/10 rounded-full blur-[50px]"></div>
      </div>

      <div className="relative z-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            {isEditing ? 'Editar Registro de Técnico' : 'Novo Registro de Técnico'}
          </h2>
          <p className="text-gray-300 mt-1">
            {isEditing 
              ? 'Atualize os detalhes deste registro de técnico' 
              : 'Registre os dados de trabalho do técnico incluindo despesas e ordens de serviço'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-2">
                Técnico
              </label>
              <select
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                required
              >
                <option value="" className="bg-[#0f172a] text-gray-200">Selecione um técnico</option>
                {technicianList.map(technician => (
                  <option key={technician.id} value={technician.name} className="bg-[#0f172a] text-gray-200">
                    {technician.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="cityId" className="block text-sm font-medium text-gray-200 mb-2">
                Cidade
              </label>
              <select
                id="cityId"
                name="cityId"
                value={formData.cityId}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                required
              >
                <option value="" className="bg-[#0f172a] text-gray-200">Selecione uma cidade</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id} className="bg-[#0f172a] text-gray-200">
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-200 mb-2">
                Data
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="serviceOrders" className="block text-sm font-medium text-gray-200 mb-2">
                Número de OS
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileEdit className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="serviceOrders"
                  name="serviceOrders"
                  value={formData.serviceOrders}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Valor por OS: R$ {serviceOrderValue.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label htmlFor="foodExpense" className="block text-sm font-medium text-gray-200 mb-2">
                Despesa de Alimentação
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  R$
                </span>
                <input
                  type="number"
                  id="foodExpense"
                  name="foodExpense"
                  value={formData.foodExpense}
                  onChange={handleInputChange}
                  className="w-full pl-8 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="fuelExpense" className="block text-sm font-medium text-gray-200 mb-2">
                Despesa de Combustível
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  R$
                </span>
                <input
                  type="number"
                  id="fuelExpense"
                  name="fuelExpense"
                  value={formData.fuelExpense}
                  onChange={handleInputChange}
                  className="w-full pl-8 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="accommodationExpense" className="block text-sm font-medium text-gray-200 mb-2">
                Despesa de Hospedagem
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  R$
                </span>
                <input
                  type="number"
                  id="accommodationExpense"
                  name="accommodationExpense"
                  value={formData.accommodationExpense}
                  onChange={handleInputChange}
                  className="w-full pl-8 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="otherExpense" className="block text-sm font-medium text-gray-200 mb-2">
                Outras Despesas
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  R$
                </span>
                <input
                  type="number"
                  id="otherExpense"
                  name="otherExpense"
                  value={formData.otherExpense}
                  onChange={handleInputChange}
                  className="w-full pl-8 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-6">
            {isEditing ? (
              <>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium flex items-center"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                  {!loading && <Save className="ml-2 h-5 w-5" />}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="px-5 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-medium flex items-center"
                >
                  Cancelar
                  <X className="ml-2 h-5 w-5" />
                </button>
              </>
            ) : (
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium flex items-center"
                disabled={loading}
              >
                {loading ? 'Adicionando...' : 'Adicionar Registro'}
                {!loading && <PlusCircle className="ml-2 h-5 w-5" />}
              </button>
            )}
          </div>

          {error && <div className="p-4 text-red-500 bg-red-500/10 rounded-lg border border-red-500/20">{error}</div>}
          {success && <div className="p-4 text-green-500 bg-green-500/10 rounded-lg border border-green-500/20">Registro salvo com sucesso!</div>}
        </form>

        <div className="mt-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Registros Recentes
            </h3>
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-400" />
              <span className="text-gray-300 text-sm">{technicians.length} registros encontrados</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Data</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Técnico</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cidade</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">OS</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Despesas</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Receita</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Lucro</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {technicians.length === 0 ? (
                  <tr className="border-b border-white/10">
                    <td colSpan={8} className="py-6 px-4 text-center text-gray-400">
                      Nenhum registro encontrado
                    </td>
                  </tr>
                ) : (
                  technicians.map((technician) => {
                    const totalExpenses = calculateTotalExpenses(technician);
                    const revenue = calculateRevenue(technician);
                    const profit = revenue - totalExpenses;
                    
                    return (
                      <tr key={technician.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-gray-200">{formatDate(technician.date)}</td>
                        <td className="py-3 px-4 text-gray-200">{technician.name}</td>
                        <td className="py-3 px-4 text-gray-200">{technician.cities?.name || ''}</td>
                        <td className="py-3 px-4 text-gray-200">{technician.service_orders}</td>
                        <td className="py-3 px-4 text-gray-200">R$ {totalExpenses.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <div className="text-gray-200">
                            <span className="text-sm text-gray-400">
                              {technician.service_orders} OS x R$ {serviceOrderValue.toFixed(2)}
                            </span>
                            <div className="font-medium">
                              R$ {revenue.toFixed(2)}
                            </div>
                          </div>
                        </td>
                        <td className={`py-3 px-4 ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          R$ {profit.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEditing(technician)}
                              className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteTechnician(technician.id)}
                              className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 