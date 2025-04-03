# Sistema de Controle de Frota

Um sistema completo para gerenciamento de frotas de veículos, monitoramento de técnicos e análise financeira, desenvolvido com React, TypeScript e Supabase. Apresenta interface moderna com design responsivo e recursos avançados de visualização de dados.

## 📋 Principais Funcionalidades

### Gestão Completa de Veículos 🚗
- Cadastro e gerenciamento detalhado de veículos (modelo, placa, ano)
- Sistema de alerta para renovação de IPVA com status visual (verde, amarelo, vermelho)
- Controle de manutenções com acompanhamento de quilometragem desde a última troca de óleo
- Interface visual intuitiva com cards interativos para seleção de veículos

### Controle Avançado de Abastecimentos ⛽
- Registro detalhado de abastecimentos com data, quilometragem, litros e valor
- Cálculo automático de consumo médio (km/l) e custo por quilômetro
- Geração de relatórios mensais com gastos totais e médias
- Exportação de histórico de abastecimentos em formato CSV/PDF

### Gestão de Técnicos em Campo 👷‍♂️
- Cadastro hierárquico de técnicos e cidades de atuação
- Controle avançado de despesas por categoria:
  * Alimentação
  * Combustível
  * Hospedagem
  * Despesas diversas
- Registro de ordens de serviço realizadas com valor configurável
- Análise financeira com cálculo de lucro/prejuízo por técnico e cidade

### Relatórios e Análises Inteligentes 📊
- Dashboard interativo com visão geral da frota e operações
- Gráficos de consumo e gastos utilizando Chart.js
- Estatísticas visuais do desempenho dos veículos:
  * Veículo mais eficiente (melhor km/l)
  * Veículo mais utilizado (maior quilometragem)
  * Veículo com maior gasto
- Exportação multi-formato de relatórios (PDF/CSV)

## 🏗️ Arquitetura do Sistema

### Frontend
- **Framework**: React 18 com TypeScript para tipagem estática
- **Estilização**: Tailwind CSS com design responsivo e suporte a temas escuros
- **Gerenciamento de UI**: Componentes modulares com separação clara de responsabilidades
- **Renderização**: Vite para build e desenvolvimento rápido

### Backend (Supabase)
- **Banco de Dados**: PostgreSQL gerenciado pelo Supabase
- **Autenticação**: Sistema completo com Supabase Auth (email/senha, provedores OAuth)
- **Armazenamento**: Storage para salvamento de avatares e documentos
- **Segurança**: Regras de Row Level Security (RLS) para controle de acesso

### Integração
- **API**: Cliente Supabase JS para comunicação com o backend
- **Persistência**: Armazenamento local para estados de sessão
- **Manipulação de Datas**: date-fns para operações complexas com datas

## 🔧 Tecnologias Utilizadas

### Frontend
- **React 18.3+**: Biblioteca principal de UI
- **TypeScript**: Tipagem estática para código mais seguro
- **Tailwind CSS**: Framework CSS utilitário para estilização
- **Lucide React + React Icons**: Ícones SVG modernos
- **Chart.js + React-Chartjs-2**: Visualização de dados em gráficos

### Backend (Supabase)
- **PostgreSQL**: Banco de dados relacional
- **Supabase Auth**: Sistema de autenticação completo
- **Supabase Storage**: Armazenamento de arquivos
- **Row Level Security**: Políticas de segurança a nível de linha

### Utilitários
- **date-fns**: Biblioteca para manipulação de datas
- **html2canvas + jsPDF**: Geração de PDFs a partir de HTML
- **Vite**: Bundler e servidor de desenvolvimento

## 📊 Estrutura do Banco de Dados

### Schema Principal
- **cars**: Armazena informações detalhadas dos veículos
  * `id`: UUID do veículo
  * `model`: Modelo do veículo
  * `license_plate`: Placa do veículo
  * `year`: Ano do veículo
  * `ipva_due_date`: Data de vencimento do IPVA
  * `ipva_paid`: Status de pagamento do IPVA
  * `last_oil_change_date`: Data da última troca de óleo
  * `last_oil_change_km`: Quilometragem da última troca de óleo
  * `user_id`: Referência ao usuário proprietário

- **fuel_entries**: Registros detalhados de abastecimentos
  * `id`: UUID do registro
  * `car_id`: Referência ao veículo
  * `date`: Data do abastecimento
  * `current_km`: Quilometragem atual
  * `liters`: Litros abastecidos
  * `total_cost`: Custo total

- **cities**: Cadastro de cidades de atuação
  * `id`: UUID da cidade
  * `name`: Nome da cidade
  * `user_id`: Referência ao usuário proprietário

- **technicians**: Registros de atividades dos técnicos
  * `id`: UUID do registro
  * `name`: Nome do técnico
  * `city_id`: Referência à cidade de atuação
  * `date`: Data da atividade
  * `food_expense`: Despesa com alimentação
  * `fuel_expense`: Despesa com combustível
  * `accommodation_expense`: Despesa com hospedagem
  * `other_expense`: Outras despesas
  * `service_orders`: Quantidade de ordens de serviço realizadas

- **technician_configs**: Configurações gerais para técnicos
  * `id`: UUID da configuração
  * `service_order_value`: Valor da ordem de serviço
  * `user_id`: Referência ao usuário proprietário

## 🔐 Autenticação e Segurança

O sistema utiliza o Supabase Auth para autenticação segura e gerenciamento de usuários:

### Credenciais para Teste
- **Login Supabase:** v.4l.j.ust.n.a@gmail.com  
- **Senha:** Solicite ao administrador do sistema

### Recursos de Segurança
- Autenticação multi-fator
- Políticas RLS (Row Level Security) para isolamento de dados
- Armazenamento seguro de senhas
- Controle de sessão com token JWT
- Integração com provedores OAuth (Google, GitHub, etc.)

## 💻 Componentes e Funcionalidades Detalhadas

### Dashboard Interativo
- Visão geral em tempo real das estatísticas de frota
- Indicadores de desempenho-chave (KPIs) atualizados automaticamente
- Alertas visuais para manutenções necessárias
- Seleção de período para análise de dados

### Gerenciamento de Veículos
- Cadastro completo com informações detalhadas
- Sistema visual de status de manutenção e IPVA
- Cálculo automático de quilometragem percorrida
- Alertas para manutenções preventivas baseadas em quilometragem

### Gestão de Abastecimentos
- Formulário intuitivo para registro rápido
- Validação de dados para evitar erros de entrada
- Cálculo automático de métricas importantes (consumo, eficiência)
- Histórico detalhado com opções de filtragem

### Sistema de Técnicos
- Gerenciamento completo de atividades em campo
- Controle financeiro por técnico e região
- Análise de rentabilidade das operações
- Dashboard específico para operações técnicas

## 🚀 Instalação e Configuração

```bash
# Clone o repositório
git clone https://github.com/Rafael130414/controller.git

# Entre no diretório do projeto
cd controller

# Instale as dependências
npm install

# Configure as variáveis de ambiente (.env)
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase

# Inicie o servidor de desenvolvimento
npm run dev
```

### Requisitos de Sistema
- Node.js 16+ (recomendado 18+)
- NPM 8+ ou Yarn 1.22+
- Navegador moderno com suporte a ES6+
- Conexão com internet para acesso ao Supabase

## 🔄 Fluxo de Trabalho e Casos de Uso

### Fluxo de Controle de Frota
1. Cadastre os veículos da frota com informações detalhadas
2. Configure datas de vencimento do IPVA e manutenções programadas
3. Registre abastecimentos conforme ocorrem, mantendo o histórico atualizado
4. Monitore relatórios de consumo e eficiência para tomada de decisões
5. Exporte relatórios mensais para prestação de contas

### Fluxo de Gestão de Técnicos
1. Cadastre cidades de atuação no sistema
2. Adicione técnicos ao cadastro principal
3. Configure o valor das ordens de serviço
4. Registre atividades diárias dos técnicos em campo
5. Acompanhe a rentabilidade das operações por região e técnico
6. Gere relatórios financeiros com análise de despesas x receitas

## 🚧 Roadmap de Desenvolvimento

### Em Desenvolvimento
- [ ] Integração com API de preços de combustíveis para comparativos
- [ ] Sistema de lembretes automáticos para manutenções e IPVA
- [ ] Módulo avançado de controle de pneus e peças

### Planejado para Próximas Versões
- [ ] Aplicativo mobile para registro em campo (React Native)
- [ ] Sistema de rotas com mapas para otimização de trajetos
- [ ] Integração com sistemas de gestão empresarial (ERP)
- [ ] Dashboard avançado com machine learning para predição de custos
- [ ] API pública para integração com outros sistemas

## 📝 Licença e Contato

### Licença
Este projeto é proprietário. Todos os direitos reservados.

### Contato
Para suporte, dúvidas ou sugestões, contate o administrador do sistema.

---

Desenvolvido com 💙 utilizando React, TypeScript e Supabase. 