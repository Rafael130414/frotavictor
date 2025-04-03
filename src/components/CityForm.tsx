import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { City } from '../types';
import { PlusCircle, Pencil, Trash2, Save, X, MapPin } from 'lucide-react';

interface CityFormProps {
  userId: string;
  onCityAdded?: () => void;
}

export default function CityForm({ userId, onCityAdded }: CityFormProps) {
  const [name, setName] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Carregar cidades ao montar o componente
  useEffect(() => {
    fetchCities();
  }, [userId]);

  // Buscar cidades do usuário atual
  async function fetchCities() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name');

      if (error) throw error;
      
      setCities(data || []);
    } catch (error) {
      console.error('Erro ao buscar cidades:', error);
      setError('Falha ao carregar cidades. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  // Adicionar nova cidade
  async function handleAddCity(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('cities')
        .insert([{ name, user_id: userId }])
        .select();

      if (error) throw error;

      setCities([...cities, data[0]]);
      setName('');
      if (onCityAdded) onCityAdded();
    } catch (error) {
      console.error('Erro ao adicionar cidade:', error);
      setError('Falha ao adicionar cidade. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  // Iniciar edição de cidade
  function startEditing(city: City) {
    setEditingCityId(city.id);
    setEditingName(city.name);
  }

  // Cancelar edição
  function cancelEditing() {
    setEditingCityId(null);
    setEditingName('');
  }

  // Salvar edição de cidade
  async function saveEditing(cityId: string) {
    if (!editingName.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('cities')
        .update({ name: editingName })
        .eq('id', cityId);

      if (error) throw error;

      setCities(
        cities.map((city) =>
          city.id === cityId ? { ...city, name: editingName } : city
        )
      );
      setEditingCityId(null);
    } catch (error) {
      console.error('Erro ao atualizar cidade:', error);
      setError('Falha ao atualizar cidade. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  // Excluir cidade
  async function deleteCity(cityId: string) {
    if (!confirm('Tem certeza que deseja excluir esta cidade?')) return;

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('cities')
        .delete()
        .eq('id', cityId);

      if (error) throw error;

      setCities(cities.filter((city) => city.id !== cityId));
    } catch (error) {
      console.error('Erro ao excluir cidade:', error);
      setError('Falha ao excluir cidade. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 bg-[#0f172a] rounded-xl">
      {/* Efeito de partículas de fundo sutis */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute w-full h-full bg-[linear-gradient(to_right,rgba(56,189,248,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,189,248,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center mb-6 border-b border-white/10 pb-4">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg mr-4 text-white">
            <MapPin size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Gestão de Cidades
            </h2>
            <p className="text-gray-400">Adicione e gerencie as cidades atendidas</p>
          </div>
        </div>

        {/* Formulário para adicionar cidade */}
        <div className="mb-8 bg-white/5 p-6 rounded-lg border border-white/10 backdrop-blur-sm">
          <form onSubmit={handleAddCity}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1">
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                  {editingCityId ? 'Editar Nome da Cidade' : 'Nome da Cidade'}
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={editingCityId ? editingName : name}
                  onChange={(e) => editingCityId ? setEditingName(e.target.value) : setName(e.target.value)}
                  className="w-full px-3 py-2 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/5 text-white"
                  placeholder="Digite o nome da cidade"
                  disabled={loading}
                />
              </div>

              <div className="col-span-1 md:col-span-2 mt-4 flex gap-3">
                {editingCityId ? (
                  <>
                    <button
                      type="button"
                      onClick={() => saveEditing(editingCityId)}
                      className="flex-1 md:flex-none px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center justify-center"
                      disabled={loading || !editingName.trim()}
                    >
                      <Save size={18} className="mr-2" />
                      {loading ? "Processando..." : "Salvar Alterações"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="flex-1 md:flex-none px-4 py-3 bg-white/10 text-white rounded-md hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 flex items-center justify-center"
                      disabled={loading}
                    >
                      <X size={18} className="mr-2" />
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    className="w-full md:w-auto px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center justify-center"
                    disabled={loading || !name.trim()}
                  >
                    <PlusCircle size={18} className="mr-2" />
                    {loading ? "Processando..." : "Adicionar Cidade"}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Mensagens de erro ou sucesso */}
        {error && (
          <div className="text-red-300 mb-6 p-4 bg-red-900/30 border-l-4 border-red-500 rounded">
            {error}
          </div>
        )}

        {/* Lista de cidades */}
        <div className="mt-8">
          <div className="flex items-center mb-4">
            <h3 className="text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Cidades Cadastradas
            </h3>
            <span className="ml-2 bg-blue-500/20 text-blue-400 py-1 px-2 rounded-full text-xs">
              {cities.length} registros
            </span>
          </div>
          
          {cities.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white/5 rounded-lg border border-white/10 text-gray-400">
              <MapPin size={48} className="mb-4 opacity-50" />
              <p>Nenhuma cidade cadastrada</p>
              <p className="text-sm mt-2">Adicione cidades usando o formulário acima</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white/5 rounded-lg border border-white/10">
              <table className="min-w-full divide-y divide-white/10">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {cities.map((city) => (
                    <tr key={city.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-300">{city.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEditing(city)}
                            className="text-blue-400 hover:text-blue-300 transition-colors p-1 rounded-full hover:bg-blue-500/20"
                            disabled={loading}
                            title="Editar cidade"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => deleteCity(city.id)}
                            className="text-red-400 hover:text-red-300 transition-colors p-1 rounded-full hover:bg-red-500/20"
                            disabled={loading}
                            title="Excluir cidade"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 