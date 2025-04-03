import React, { useState, useEffect } from 'react';
import { Upload, Search, X, FileText, Download, Trash2, Filter, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Tipo para os anexos
interface Attachment {
  id: string;
  fileName: string;
  description: string;
  dateUploaded: string;
  fileSize: string;
  fileType: string;
  url: string;
}

// Componente principal de Anexos
const Attachments: React.FC = () => {
  // Estados
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Buscar anexos do banco de dados
  useEffect(() => {
    fetchAttachments();
  }, []);

  // Função para buscar anexos do banco de dados
  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .order('date_uploaded', { ascending: false });

      if (error) {
        console.error('Erro ao buscar anexos:', error);
        throw error;
      }

      if (data) {
        const formattedAttachments = data.map(item => ({
          id: item.id,
          fileName: item.file_name,
          description: item.description || '',
          dateUploaded: new Date(item.date_uploaded).toISOString().split('T')[0],
          fileSize: item.file_size,
          fileType: item.file_type,
          url: item.url
        }));
        setAttachments(formattedAttachments);
      }
    } catch (error) {
      console.error('Erro ao processar busca de anexos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtragem de anexos baseado na busca
  const filteredAttachments = attachments.filter(attachment => {
    const matchesSearch = 
      attachment.fileName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      attachment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFileType = 
      fileTypeFilter === 'all' || 
      attachment.fileType === fileTypeFilter;
    
    return matchesSearch && matchesFileType;
  });

  // Função para lidar com o upload de arquivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Função para lidar com o upload
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      setUploading(true);
      
      // Criar nome único para o arquivo
      const timestamp = Date.now();
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${timestamp}_${selectedFile.name}`;
      
      console.log('Iniciando upload do arquivo:', filePath);
      
      // Upload do arquivo para o storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw uploadError;
      }

      console.log('Upload concluído:', uploadData);
      
      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      console.log('URL pública gerada:', publicUrl);
      
      // Salvar metadados no banco de dados
      const { data: dbData, error: dbError } = await supabase
        .from('attachments')
        .insert({
          file_name: selectedFile.name,
          description: description,
          file_type: fileExt || 'unknown',
          file_size: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`,
          file_path: filePath,
          url: publicUrl,
        })
        .select()
        .single();
      
      if (dbError) {
        console.error('Erro ao salvar no banco:', dbError);
        throw dbError;
      }

      console.log('Dados salvos no banco:', dbData);
      
      // Buscar anexos atualizados
      await fetchAttachments();
      
      // Resetar o formulário
      setSelectedFile(null);
      setDescription('');
      
      // Limpar o input file
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      alert('Arquivo enviado com sucesso!');
    } catch (error: any) {
      console.error('Erro detalhado:', error);
      alert(`Erro ao enviar arquivo: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Função para baixar um anexo
  const handleDownload = async (url: string, fileName: string) => {
    try {
      // Criar um link temporário para download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      alert('Erro ao fazer download do arquivo.');
    }
  };

  // Função para remover um anexo
  const handleRemove = async (id: string, filePath: string) => {
    if (!confirm('Tem certeza que deseja remover este anexo?')) return;
    
    try {
      // Encontrar o anexo para obter o file_path
      const attachmentToRemove = attachments.find(a => a.id === id);
      if (!attachmentToRemove) return;
      
      // Buscar o file_path do banco de dados
      const { data, error: fetchError } = await supabase
        .from('attachments')
        .select('file_path')
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;
      
      const filePath = data.file_path;
      
      // Remover do banco de dados
      const { error: dbError } = await supabase
        .from('attachments')
        .delete()
        .eq('id', id);
        
      if (dbError) throw dbError;
      
      // Remover do storage
      const { error: storageError } = await supabase.storage
        .from('attachments')
        .remove([filePath]);
        
      if (storageError) {
        console.error('Erro ao remover arquivo do storage:', storageError);
        // Continuamos mesmo se o arquivo não for removido do storage
      }
      
      // Atualizar a lista
      setAttachments(attachments.filter(attachment => attachment.id !== id));
      
      alert('Anexo removido com sucesso!');
    } catch (error: any) {
      console.error('Erro ao remover anexo:', error);
      alert(`Erro ao remover anexo: ${error.message}`);
    }
  };

  // Função para obter o ícone do tipo de arquivo
  const getFileIcon = (fileType: string) => {
    switch(fileType.toLowerCase()) {
      case 'pdf':
        return <div className="w-8 h-8 bg-red-500/20 rounded flex items-center justify-center text-red-500">PDF</div>;
      case 'xlsx':
      case 'xls':
        return <div className="w-8 h-8 bg-green-500/20 rounded flex items-center justify-center text-green-500">XLS</div>;
      case 'docx':
      case 'doc':
        return <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center text-blue-500">DOC</div>;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <div className="w-8 h-8 bg-purple-500/20 rounded flex items-center justify-center text-purple-500">IMG</div>;
      default:
        return <div className="w-8 h-8 bg-gray-500/20 rounded flex items-center justify-center text-gray-500"><FileText size={16} /></div>;
    }
  };

  // Componente de filtro
  const FilterPanel = () => (
    <div className="bg-white/5 rounded-lg p-4 mb-4 border border-white/10">
      <h3 className="text-white text-sm font-medium mb-3">Filtrar por tipo</h3>
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={() => setFileTypeFilter('all')} 
          className={`px-3 py-1 text-xs rounded-full ${fileTypeFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white'}`}
        >
          Todos
        </button>
        <button 
          onClick={() => setFileTypeFilter('pdf')} 
          className={`px-3 py-1 text-xs rounded-full ${fileTypeFilter === 'pdf' ? 'bg-red-500 text-white' : 'bg-white/10 text-white'}`}
        >
          PDF
        </button>
        <button 
          onClick={() => setFileTypeFilter('xlsx')} 
          className={`px-3 py-1 text-xs rounded-full ${fileTypeFilter === 'xlsx' ? 'bg-green-500 text-white' : 'bg-white/10 text-white'}`}
        >
          Excel
        </button>
        <button 
          onClick={() => setFileTypeFilter('doc')} 
          className={`px-3 py-1 text-xs rounded-full ${fileTypeFilter === 'doc' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white'}`}
        >
          Word
        </button>
        <button 
          onClick={() => setFileTypeFilter('jpg')} 
          className={`px-3 py-1 text-xs rounded-full ${fileTypeFilter === 'jpg' ? 'bg-purple-500 text-white' : 'bg-white/10 text-white'}`}
        >
          Imagens
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Área de upload */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Enviar Novo Anexo</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Arquivo
            </label>
            <div className="relative">
              <input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex items-center justify-center w-full border-2 border-dashed border-white/20 rounded-lg h-32 hover:border-blue-400 transition-colors duration-200"
              >
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <span className="mt-2 block text-sm font-medium text-gray-300">
                    {selectedFile ? selectedFile.name : 'Clique para selecionar um arquivo'}
                  </span>
                </div>
              </label>
              {selectedFile && (
                <button
                  onClick={() => setSelectedFile(null)}
                  className="absolute top-2 right-2 rounded-full bg-white/10 p-1 hover:bg-white/20 transition-colors"
                >
                  <X size={16} className="text-white" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descrição
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione uma descrição para facilitar buscas futuras"
              className="w-full rounded-lg bg-white/5 border border-white/10 p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              !selectedFile || uploading
                ? 'bg-white/10 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg transition-all duration-300'
            }`}
          >
            {uploading ? <Loader size={16} className="animate-spin mr-2" /> : <Upload size={16} className="mr-2" />}
            <span>{uploading ? 'Enviando...' : 'Enviar Arquivo'}</span>
          </button>
        </div>
      </div>

      {/* Área de busca */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-white">Anexos</h2>
          
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou descrição"
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
            
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
            >
              <Filter size={16} />
            </button>
          </div>
        </div>
        
        {/* Painel de filtros */}
        {filterOpen && <FilterPanel />}

        {/* Lista de anexos */}
        <div className="overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader size={40} className="text-blue-400 animate-spin" />
              <span className="ml-3 text-gray-300">Carregando anexos...</span>
            </div>
          ) : filteredAttachments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-white">Nenhum anexo encontrado</h3>
              <p className="mt-1 text-sm text-gray-400">
                {searchTerm ? 'Tente ajustar sua busca' : 'Envie seu primeiro arquivo usando o formulário acima'}
              </p>
            </div>
          ) : (
            <div className="mt-2 divide-y divide-white/10">
              {filteredAttachments.map((attachment) => (
                <div key={attachment.id} className="py-4 flex items-start hover:bg-white/5 p-2 rounded-lg transition">
                  <div className="mr-4">
                    {getFileIcon(attachment.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">{attachment.fileName}</h4>
                    <p className="mt-1 text-sm text-gray-400 line-clamp-2">{attachment.description}</p>
                    <div className="mt-2 flex text-xs text-gray-400">
                      <span>{attachment.dateUploaded}</span>
                      <span className="mx-2">•</span>
                      <span>{attachment.fileSize}</span>
                    </div>
                  </div>
                  <div className="ml-4 flex space-x-2">
                    <button 
                      onClick={() => handleDownload(attachment.url, attachment.fileName)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                    >
                      <Download size={16} className="text-blue-400" />
                    </button>
                    <button 
                      onClick={() => handleRemove(attachment.id, attachment.fileType)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-red-900/20 transition"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attachments; 