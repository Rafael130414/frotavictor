'use client';

import { useState } from 'react';
import { FaUser, FaLock, FaGoogle, FaFacebook, FaGithub, FaEnvelope, FaKey } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // IMPORTANTE: Este é um login temporário para teste
    // TODO: Implementar autenticação real posteriormente
    // Por enquanto, qualquer email/senha será aceito
    try {
      // Simulando uma requisição de login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Armazenando email do usuário no localStorage apenas para demonstração
      localStorage.setItem('userEmail', email);
      
      // Redirecionando para a página inicial
      router.push('/dashboard');
    } catch (error) {
      console.error('Erro ao fazer login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] overflow-hidden rounded-2xl shadow-2xl transition-all duration-500 bg-white bg-opacity-95 backdrop-blur-sm hover:shadow-indigo-500/30 relative">
      {/* Efeito de brilho no canto superior */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500 rounded-full opacity-20 blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-500 rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="relative h-40 bg-gradient-to-r from-blue-600 to-indigo-800 overflow-visible">
        {/* Efeito de partículas no cabeçalho */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${1 + Math.random() * 3}s`,
                animationDelay: `${Math.random() * 2}s`,
                transform: `scale(${0.5 + Math.random() * 0.5})`
              }}
            />
          ))}
        </div>

        {/* Efeito de linha animada */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute h-[1px] w-40 bg-gradient-to-r from-transparent via-white to-transparent animate-slide-right" style={{ top: '30%' }}></div>
          <div className="absolute h-[1px] w-40 bg-gradient-to-r from-transparent via-white to-transparent animate-slide-left" style={{ top: '60%' }}></div>
        </div>
        
        <div className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 p-2 bg-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-10 hover:shadow-indigo-500/30">
          <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full text-white transition-all duration-300 hover:rotate-12 group">
            <FaUser size={28} className="transition-transform duration-300 group-hover:scale-125" />
          </div>
        </div>
      </div>
      
      <div className="relative px-10 pt-12 pb-8">
        <h2 className="text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-indigo-600 hover:to-blue-600 transition-all duration-300 cursor-default">Bem-vindo</h2>
        <p className="text-base text-center text-gray-500 mb-8 hover:text-blue-500 transition-colors duration-300 cursor-default">Entre com sua conta para continuar</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative transition-all duration-300 transform hover:scale-102 focus-within:scale-102 group">
            <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full pl-10 pr-4 py-3 text-base border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-gray-50 rounded-t-lg transition-all duration-300 group-hover:border-blue-400 group-hover:bg-blue-50 focus:ring-2 focus:ring-blue-200"
              required
            />
            <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100 group-focus-within:scale-x-100"></div>
          </div>

          <div className="relative transition-all duration-300 transform hover:scale-102 focus-within:scale-102 group">
            <FaKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" size={18} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full pl-10 pr-4 py-3 text-base border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-gray-50 rounded-t-lg transition-all duration-300 group-hover:border-blue-400 group-hover:bg-blue-50 focus:ring-2 focus:ring-blue-200"
              required
            />
            <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100 group-focus-within:scale-x-100"></div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center group cursor-pointer select-none">
              <div className="relative">
                <input type="checkbox" className="sr-only" />
                <div className="w-4 h-4 border-2 border-gray-300 rounded transition-all duration-300 group-hover:border-blue-500"></div>
                <div className="absolute inset-0 bg-blue-500 rounded transform scale-0 transition-transform duration-300 group-hover:scale-90 opacity-0 group-hover:opacity-20"></div>
                <div className="absolute inset-0 flex items-center justify-center text-blue-500 opacity-0 transform scale-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
              <span className="ml-2 text-gray-600 group-hover:text-blue-500 transition-colors duration-300">Lembrar-me</span>
            </label>
            <a href="#" className="text-blue-500 hover:text-blue-600 transition-all duration-300 hover:underline hover:translate-x-1 inline-block">
              Esqueceu a senha?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg text-base font-medium text-white transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-1 active:translate-y-0 relative overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              background: isHovered
                ? 'linear-gradient(90deg, #4f46e5 0%, #3b82f6 100%)'
                : 'linear-gradient(90deg, #3b82f6 0%, #4f46e5 100%)'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <span className="relative z-10 flex items-center justify-center">
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {isLoading ? 'Entrando...' : 'Entrar'}
            </span>
            <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-white/20 to-transparent transform -skew-x-45 translate-x-full transition-transform duration-500 ease-out group-hover:translate-x-0"></div>
          </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 hover:text-blue-500 transition-colors duration-300 cursor-default">Ou continue com</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <a
              href="#"
              className="relative flex justify-center items-center py-3 px-4 border border-gray-200 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-red-50 transition-all duration-300 hover:border-red-300 hover:scale-105 hover:shadow-md group overflow-hidden"
              onMouseEnter={() => setHoveredIcon('google')}
              onMouseLeave={() => setHoveredIcon(null)}
            >
              <FaGoogle className={`transition-all duration-300 ${hoveredIcon === 'google' ? 'text-red-600 scale-125' : 'text-red-600'}`} size={20} />
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </a>
            <a
              href="#"
              className="relative flex justify-center items-center py-3 px-4 border border-gray-200 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-blue-50 transition-all duration-300 hover:border-blue-300 hover:scale-105 hover:shadow-md group overflow-hidden"
              onMouseEnter={() => setHoveredIcon('facebook')}
              onMouseLeave={() => setHoveredIcon(null)}
            >
              <FaFacebook className={`transition-all duration-300 ${hoveredIcon === 'facebook' ? 'text-blue-600 scale-125' : 'text-blue-600'}`} size={20} />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </a>
            <a
              href="#"
              className="relative flex justify-center items-center py-3 px-4 border border-gray-200 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 transition-all duration-300 hover:border-gray-400 hover:scale-105 hover:shadow-md group overflow-hidden"
              onMouseEnter={() => setHoveredIcon('github')}
              onMouseLeave={() => setHoveredIcon(null)}
            >
              <FaGithub className={`transition-all duration-300 ${hoveredIcon === 'github' ? 'text-gray-800 scale-125' : 'text-gray-800'}`} size={20} />
              <div className="absolute inset-0 bg-gradient-to-br from-gray-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </a>
          </div>
        </div>

        <p className="text-center mt-8 text-sm text-gray-600">
          Não tem uma conta?{' '}
          <a href="#" className="text-blue-500 hover:text-blue-600 hover:underline font-medium transition-all duration-300 inline-block hover:translate-x-1">
            Registre-se agora
          </a>
        </p>
      </div>
    </div>
  );
} 