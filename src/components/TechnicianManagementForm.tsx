import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2, Save, X, Users } from 'lucide-react';

interface TechnicianItem {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

interface TechnicianManagementFormProps {
  userId: string;
}

export default function TechnicianManagementForm({ userId }: TechnicianManagementFormProps) {
  const [technicians, setTechnicians] = useState<TechnicianItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Buscar técnicos ao montar o componente
  useEffect(() => {
    fetchTechnicians();
  }, [userId]);

  // Buscar técnicos do banco de dados
  async function fetchTechnicians() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('technician_list')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      setTechnicians(data || []);
    } catch (error: any) {
      setError('Erro ao buscar técnicos: ' + error.message);
      console.error('Erro ao buscar técnicos:', error);
    } finally {
      setLoading(false);
    }
  }

  // Adicionar novo técnico
  async function handleAddTechnician(e: React.FormEvent) {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Por favor, insira um nome para o técnico');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Verificar se já existe um técnico com este nome
      const { data: existingTech } = await supabase
        .from('technician_list')
        .select('*')
        .eq('name', name.trim())
        .maybeSingle();
        
      if (existingTech) {
        setError('Já existe um técnico com este nome');
        return;
      }
      
      // Se estiver editando, atualizar registro existente
      if (isEditing && editingId) {
        const { error } = await supabase
          .from('technician_list')
          .update({ name: name.trim() })
          .eq('id', editingId);
          
        if (error) throw error;
        
        setSuccess('Técnico atualizado com sucesso!');
        setIsEditing(false);
        setEditingId(null);
      } else {
        // Senão, inserir novo registro
        const { error } = await supabase
          .from('technician_list')
          .insert([{ name: name.trim(), user_id: userId }]);
          
        if (error) throw error;
        
        setSuccess('Técnico adicionado com sucesso!');
      }
      
      // Limpar o campo e recarregar a lista
      setName('');
      fetchTechnicians();
      
      // Limpar a mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error: any) {
      setError('Erro ao adicionar técnico: ' + error.message);
      console.error('Erro ao adicionar técnico:', error);
    } finally {
      setLoading(false);
    }
  }

  // Excluir técnico
  async function handleDeleteTechnician(id: string) {
    if (!confirm('Tem certeza que deseja excluir este técnico?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('technician_list')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setSuccess('Técnico excluído com sucesso!');
      fetchTechnicians();
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error: any) {
      setError('Erro ao excluir técnico: ' + error.message);
      console.error('Erro ao excluir técnico:', error);
    } finally {
      setLoading(false);
    }
  }

  // Iniciar edição de técnico
  function handleEditStart(technician: TechnicianItem) {
    setName(technician.name);
    setIsEditing(true);
    setEditingId(technician.id);
  }

  // Cancelar edição
  function handleCancelEdit() {
    setName('');
    setIsEditing(false);
    setEditingId(null);
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
        <div className="mb-6 flex items-center space-x-3">
          <Users className="h-8 w-8 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Gerenciamento de Técnicos
            </h2>
            <p className="text-gray-300 mt-1">
              Adicione, edite ou remova técnicos disponíveis no sistema
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 text-red-400 bg-red-500/10 rounded-lg border border-red-500/20 mb-4 relative">
            {error}
            <button 
              className="absolute top-3 right-3 text-red-400 hover:text-red-300 transition-colors"
              onClick={() => setError(null)}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {success && (
          <div className="p-4 text-green-400 bg-green-500/10 rounded-lg border border-green-500/20 mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleAddTechnician} className="mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do técnico"
                className="w-full bg-white/5 border border-white/10 text-gray-200 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium flex items-center"
              disabled={loading}
            >
              {loading ? (
                'Processando...'
              ) : isEditing ? (
                <>
                  <Save size={18} className="mr-2" /> Salvar
                </>
              ) : (
                <>
                  <Plus size={18} className="mr-2" /> Adicionar
                </>
              )}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-5 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-medium flex items-center"
                disabled={loading}
              >
                <X size={18} className="mr-2" /> Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Nome
                </th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {technicians.length === 0 ? (
                <tr className="border-b border-white/10">
                  <td colSpan={2} className="py-6 px-4 text-center text-gray-400">
                    {loading ? 'Carregando técnicos...' : 'Nenhum técnico cadastrado'}
                  </td>
                </tr>
              ) : (
                technicians.map((technician) => (
                  <tr key={technician.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-gray-200">
                      {technician.name}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditStart(technician)}
                          className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                          title="Editar"
                          disabled={loading}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTechnician(technician.id)}
                          className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                          title="Excluir"
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 