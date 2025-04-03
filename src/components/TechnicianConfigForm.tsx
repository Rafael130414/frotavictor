import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TechnicianConfig } from '../types';
import { Save } from 'lucide-react';

interface TechnicianConfigFormProps {
  userId: string;
}

export default function TechnicianConfigForm({ userId }: TechnicianConfigFormProps) {
  const [serviceOrderValue, setServiceOrderValue] = useState('');
  const [configId, setConfigId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Carregar configuração existente ao montar o componente
  useEffect(() => {
    fetchConfig();
  }, [userId]);

  // Buscar configuração do usuário atual
  async function fetchConfig() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('technician_configs')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setServiceOrderValue(data.service_order_value.toString());
        setConfigId(data.id);
      }
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      setError('Falha ao carregar configuração. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  // Salvar configuração
  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    const parsedValue = parseFloat(serviceOrderValue);
    if (!parsedValue || parsedValue <= 0) {
      setError('O valor da ordem de serviço deve ser maior que zero.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      let result;
      
      if (configId) {
        // Atualizar configuração existente
        result = await supabase
          .from('technician_configs')
          .update({ service_order_value: parsedValue })
          .eq('id', configId);
      } else {
        // Criar nova configuração
        result = await supabase
          .from('technician_configs')
          .insert([{ service_order_value: parsedValue, user_id: userId }])
          .select();
          
        if (result.data && result.data.length > 0) {
          setConfigId(result.data[0].id);
        }
      }

      if (result.error) throw result.error;
      
      setSuccess(true);
      // Esconder mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      setError('Falha ao salvar configuração. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6 border-b pb-3 text-blue-700">Configurações do Sistema</h2>

      {/* Formulário para configurações */}
      <form onSubmit={handleSaveConfig} className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1">
            <label htmlFor="serviceOrderValue" className="block text-sm font-medium text-gray-700 mb-1">
              Valor da Ordem de Serviço (R$)
            </label>
            <input
              id="serviceOrderValue"
              name="serviceOrderValue"
              type="number"
              min="0"
              step="0.01"
              value={serviceOrderValue}
              onChange={(e) => setServiceOrderValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
              placeholder="Valor por O.S."
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">Este valor será usado para calcular a receita em todos os relatórios</p>
          </div>

          <div className="col-span-1 md:col-span-2 mt-4">
            <button
              type="submit"
              className="w-full md:w-auto px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center shadow transform transition-transform duration-200 hover:-translate-y-0.5"
              disabled={loading}
            >
              <Save size={18} className="mr-2" />
              {loading ? "Salvando..." : "Salvar Configurações"}
            </button>
          </div>
        </div>
      </form>

      {/* Mensagens de erro ou sucesso */}
      {error && <div className="text-red-500 mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">{error}</div>}
      {success && <div className="text-green-500 mb-4 p-3 bg-green-50 border-l-4 border-green-500 rounded">Configurações salvas com sucesso!</div>}

      <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="font-medium text-lg mb-3 text-blue-700">Informações do Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Versão do Sistema</p>
            <p className="font-medium">1.0.0</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Última Atualização</p>
            <p className="font-medium">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 