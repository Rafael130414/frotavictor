import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { format, parse, getYear, getMonth, setMonth, setYear, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Printer, FileDown, FileText } from 'lucide-react';
import { TechnicianMonthlyReport, City, Technician } from '../types';

// Estendendo o tipo Technician para incluir cities
interface TechnicianWithCity extends Technician {
  cities?: {
    name: string;
  };
}

interface TechnicianReportsProps {
  userId: string;
}

export default function TechnicianReports({ userId }: TechnicianReportsProps) {
  const [selectedMonth, setSelectedMonth] = useState(getMonth(new Date()));
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()));
  const [cities, setCities] = useState<City[]>([]);
  const [reports, setReports] = useState<TechnicianMonthlyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceOrderValue, setServiceOrderValue] = useState(0);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchCities();
    fetchConfig();
  }, [userId]);

  // Também gerar relatório quando o config for carregado (quando o componente montar)
  useEffect(() => {
    if (configLoaded && serviceOrderValue > 0) {
      generateReport();
    }
  }, [configLoaded]);

  // Buscar relatório quando mudar o mês/ano selecionado
  useEffect(() => {
    if (serviceOrderValue > 0) {
      generateReport();
    }
  }, [selectedMonth, selectedYear, serviceOrderValue]);

  // Buscar cidades do usuário atual
  async function fetchCities() {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name');

      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      console.error('Erro ao buscar cidades:', error);
      setError('Falha ao carregar cidades. Tente novamente.');
    }
  }

  // Buscar configuração de valor de ordem de serviço
  async function fetchConfig() {
    try {
      // Buscar o último valor configurado, ordenado por data de atualização
      let { data, error } = await supabase
        .from('technician_configs')
        .select('service_order_value')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        console.error('Erro ao buscar configuração:', error);
        // Se houver erro, manter o valor atual do estado ou usar o padrão
        const currentValue = serviceOrderValue || 90;
        setServiceOrderValue(currentValue);
        setError(null);
      } else if (data.service_order_value) {
        // Se encontrou dados válidos, usar o valor da configuração
        setServiceOrderValue(data.service_order_value);
        setError(null);
      } else {
        // Se o valor for inválido, usar o valor atual ou padrão
        const currentValue = serviceOrderValue || 90;
        setServiceOrderValue(currentValue);
        setError(null);
      }
      
      // Marcar que a configuração foi carregada
      setConfigLoaded(true);
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      // Se houver erro, manter o valor atual do estado ou usar o padrão
      const currentValue = serviceOrderValue || 90;
      setServiceOrderValue(currentValue);
      setConfigLoaded(true);
      setError(null);
    }
  }

  // Gerar relatório com base no mês e ano selecionados
  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar configuração atualizada para valor da ordem de serviço
      const { data: configData, error: configError } = await supabase
        .from('technician_configs')
        .select('service_order_value')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
        
      // Definir o valor da ordem de serviço
      if (!configError && configData) {
        setServiceOrderValue(configData.service_order_value);
      }
      // Se houver erro, manter o valor atual do estado
      
      // Datas para filtrar o mês selecionado
      const startDate = format(new Date(selectedYear, selectedMonth, 1), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date(selectedYear, selectedMonth, 1)), 'yyyy-MM-dd');
      
      // Buscar técnicos para o período selecionado
      const { data: techniciansData, error: techniciansError } = await supabase
        .from('technicians')
        .select('*, cities(name)')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });
        
      if (techniciansError) throw techniciansError;
      
      // Verificar se temos dados de técnicos
      if (!techniciansData || techniciansData.length === 0) {
        setReports([]);
        setLoading(false);
        return;
      }
      
      // Processar dados mostrando todos os registros individuais
      const cityReports: Record<string, TechnicianMonthlyReport> = {};

      // Inicializar relatórios para todas as cidades
      cities.forEach(city => {
        cityReports[city.id] = {
          city: city.name,
          technicians: [],
          totals: {
            expenses: 0,
            serviceOrders: 0,
            revenue: 0,
            profit: 0
          }
        };
      });
      
      // Adicionar categoria para cidades não mapeadas
      cityReports['unknown'] = {
        city: 'Cidades não mapeadas',
        technicians: [],
        totals: {
          expenses: 0,
          serviceOrders: 0,
          revenue: 0,
          profit: 0
        }
      };
      
      // Processar cada registro individualmente (sem agrupar por técnico)
      techniciansData.forEach(tech => {
        // Verificar se tem o cityId, senão usar 'unknown'
        const cityId = tech.city_id || 'unknown';
        
        // Calcular valores para este registro individual
        const foodExpense = Number(tech.food_expense) || 0;
        const fuelExpense = Number(tech.fuel_expense) || 0;
        const accommodationExpense = Number(tech.accommodation_expense) || 0;
        const otherExpense = Number(tech.other_expense) || 0;
        const serviceOrders = Number(tech.service_orders) || 0;
        
        // Calcular totais
        const totalExpenses = foodExpense + fuelExpense + accommodationExpense + otherExpense;
        const revenue = serviceOrders * serviceOrderValue;
        const profit = revenue - totalExpenses;
        
        // Criar objeto de técnico para este registro individual
        const technicianEntry = {
          name: tech.name || 'Sem nome',
          date: tech.date,
          expenses: {
            food: foodExpense,
            fuel: fuelExpense,
            accommodation: accommodationExpense,
            other: otherExpense,
            total: totalExpenses
          },
          serviceOrders,
          revenue,
          profit
        };
        
        // Verificar se a cidade existe no relatório, senão adicionar à categoria 'unknown'
        const targetCityId = cityReports[cityId] ? cityId : 'unknown';
        
        // Adicionar registro individual
        cityReports[targetCityId].technicians.push(technicianEntry);
        
        // Atualizar totais da cidade
        cityReports[targetCityId].totals.expenses += totalExpenses;
        cityReports[targetCityId].totals.serviceOrders += serviceOrders;
        cityReports[targetCityId].totals.revenue += revenue;
        cityReports[targetCityId].totals.profit += profit;
      });
      
      // Remover a categoria 'unknown' se não tiver técnicos
      if (cityReports['unknown'] && cityReports['unknown'].technicians.length === 0) {
        delete cityReports['unknown'];
      }
      
      // Transformar objeto em array e definir os relatórios
      setReports(Object.values(cityReports));
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setError('Falha ao gerar relatório. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Exportar relatório para PDF
  async function exportToPDF() {
    try {
      const reportElement = document.getElementById('report-container');
      if (!reportElement) return;

      setLoading(true);

      const canvas = await html2canvas(reportElement, {
        scale: 2, // Aumentar qualidade
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Criar PDF em A4
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Nome do mês em português
      const monthName = format(new Date(selectedYear, selectedMonth), 'MMMM', { locale: ptBR });
      
      // Gerar nome do arquivo
      pdf.save(`relatorio_tecnicos_${monthName}_${selectedYear}.pdf`);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      setError('Falha ao exportar PDF. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  // Formatar valores como moeda brasileira
  function formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
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

  // Adicionar um botão para forçar a geração do relatório
  function handleRefreshReport() {
    generateReport();
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Relatórios de Despesas e Ordens de Serviço</h2>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="w-full md:w-auto">
          <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
            Mês
          </label>
          <select
            id="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {format(setMonth(new Date(), i), 'MMMM', { locale: ptBR })}
              </option>
            ))}
          </select>
        </div>
        
        <div className="w-full md:w-auto">
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
            Ano
          </label>
          <select
            id="year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = getYear(new Date()) - 2 + i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
        </div>
        
        <div className="flex-grow"></div>
        
        <div className="self-end flex gap-2">
          <button 
            onClick={handleRefreshReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
            disabled={loading}
          >
            Atualizar
          </button>
          <button 
            onClick={exportToPDF} 
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
            disabled={loading || reports.length === 0}
          >
            <FileDown size={18} className="mr-1" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Mensagem de erro */}
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {loading && <div className="text-blue-500 mb-4">Carregando relatório...</div>}

      {/* Relatório */}
      <div 
        id="report-container" 
        className="mt-6 bg-white p-4"
      >
        <h3 className="text-xl font-bold mb-4 text-center">
          Relatório de Despesas e Ordens de Serviço
        </h3>
        <h4 className="text-lg font-semibold mb-6 text-center">
          {format(new Date(selectedYear, selectedMonth), 'MMMM yyyy', { locale: ptBR })}
        </h4>

        {reports.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nenhum registro encontrado para o período selecionado</p>
        ) : (
          <div className="space-y-8">
            {reports.map((report) => {
              // Verificar se tem técnicos
              const hasTechnicians = report.technicians && report.technicians.length > 0;
              
              return (
                <div key={report.city} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 font-medium">
                    <h5 className="text-lg">{report.city}</h5>
                  </div>

                  {!hasTechnicians ? (
                    <p className="text-gray-500 text-center py-4">Nenhum registro para esta cidade</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Técnico</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alimentação</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Combustível</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hospedagem</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outros</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Despesas</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">O.S.</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receita</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lucro</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {report.technicians.map((tech, index) => (
                            <tr key={index}>
                              <td className="px-3 py-3 whitespace-nowrap">{tech.name}</td>
                              <td className="px-3 py-3 whitespace-nowrap">{formatDate(tech.date)}</td>
                              <td className="px-3 py-3 whitespace-nowrap text-red-600">{formatCurrency(tech.expenses.food)}</td>
                              <td className="px-3 py-3 whitespace-nowrap text-red-600">{formatCurrency(tech.expenses.fuel)}</td>
                              <td className="px-3 py-3 whitespace-nowrap text-red-600">{formatCurrency(tech.expenses.accommodation)}</td>
                              <td className="px-3 py-3 whitespace-nowrap text-red-600">{formatCurrency(tech.expenses.other)}</td>
                              <td className="px-3 py-3 whitespace-nowrap font-medium text-red-600">{formatCurrency(tech.expenses.total)}</td>
                              <td className="px-3 py-3 whitespace-nowrap">{tech.serviceOrders}</td>
                              <td className="px-3 py-3 whitespace-nowrap">{formatCurrency(tech.revenue)}</td>
                              <td className={`px-3 py-3 whitespace-nowrap font-medium ${tech.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(tech.profit)}
                              </td>
                            </tr>
                          ))}
                          {/* Linha de totais */}
                          <tr className="bg-gray-50 font-semibold">
                            <td className="px-3 py-3 whitespace-nowrap">TOTAL</td>
                            <td className="px-3 py-3 whitespace-nowrap">-</td>
                            <td className="px-3 py-3 whitespace-nowrap text-red-600">-</td>
                            <td className="px-3 py-3 whitespace-nowrap text-red-600">-</td>
                            <td className="px-3 py-3 whitespace-nowrap text-red-600">-</td>
                            <td className="px-3 py-3 whitespace-nowrap text-red-600">-</td>
                            <td className="px-3 py-3 whitespace-nowrap text-red-600">{formatCurrency(report.totals.expenses)}</td>
                            <td className="px-3 py-3 whitespace-nowrap">{report.totals.serviceOrders}</td>
                            <td className="px-3 py-3 whitespace-nowrap">{formatCurrency(report.totals.revenue)}</td>
                            <td className={`px-3 py-3 whitespace-nowrap ${report.totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(report.totals.profit)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Estatísticas totais do mês */}
            <div className="border rounded-lg overflow-hidden mt-4">
              <div className="bg-blue-100 px-4 py-2 font-medium">
                <h5 className="text-lg">Estatísticas do Mês</h5>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-gray-500 text-sm">Total de Despesas</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(reports.reduce((acc, city) => acc + city.totals.expenses, 0))}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-gray-500 text-sm">Total de Ordens de Serviço</p>
                  <p className="text-xl font-bold">
                    {reports.reduce((acc, city) => acc + city.totals.serviceOrders, 0)}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-gray-500 text-sm">Total de Receita</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(reports.reduce((acc, city) => acc + city.totals.revenue, 0))}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-gray-500 text-sm">Lucro Líquido</p>
                  <p className={`text-xl font-bold ${
                    reports.reduce((acc, city) => acc + city.totals.profit, 0) >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {formatCurrency(reports.reduce((acc, city) => acc + city.totals.profit, 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 