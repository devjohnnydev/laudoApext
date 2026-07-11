# APEXTECH METAIS - Sistema ERP de Análises Laboratoriais

Este projeto contém o sistema completo de gerenciamento de análises gravimétricas, controle de composições químicas, histórico de laudos técnicos industriais e atualização inteligente de estoques da **APEXTECH METAIS**.

---

## 🛠️ Arquitetura do Sistema

O sistema é dividido em duas partes principais:

1. **Backend (`/backend`)**:
   - Desenvolvido em **Node.js** com **Express** e **TypeScript**.
   - Persistência estruturada com **Prisma ORM** para banco **PostgreSQL**.
   - Logs de auditoria automática e controle de perfis.
   - Possui **fallback inteligente em memória** (o servidor API funciona standalone mesmo se não houver um banco PostgreSQL ativo).

2. **Frontend (`/frontend`)**:
   - Desenvolvido em **React**, **TypeScript** e **Vite**.
   - Design System customizado de alto padrão baseado no tema escuro premium da ApexTech Metais.
   - Gráficos integrados com **Chart.js** e animações dinâmicas com **Framer Motion**.
   - Geração de laudos PDF e planilhas Excel integradas no lado do cliente.
   - Permite simular diferentes perfis de usuário (`ADMIN`, `LAB`, `COMPRAS`, `PROD`, `FIN`, `DIR`) com restrições e permissões visuais específicas em tempo real.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js (v18 ou superior) instalado.

### Passo 1: Configurar e Rodar o Backend
1. Entre na pasta do backend:
   ```bash
   cd backend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor em modo de desenvolvimento:
   ```bash
   npm run dev
   ```
   *O backend subirá em `http://localhost:4000`. Ele detectará que não há PostgreSQL conectado e ativará automaticamente o banco de dados simulado em memória.*

### Passo 2: Configurar e Rodar o Frontend
1. Entre na pasta do frontend:
   ```bash
   cd ../frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie a aplicação:
   ```bash
   npm run dev
   ```
4. Abra o navegador em: [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Banco de Dados PostgreSQL (Opcional)

Se desejar usar uma base física do PostgreSQL:
1. Altere o arquivo `backend/.env` com a sua string de conexão:
   ```env
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/nome_banco?schema=public"
   ```
2. Execute as migrations e rode o seed para carregar os materiais padrão:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```
3. Alternativamente, você pode executar o script SQL bruto contido em `backend/db_setup.sql` diretamente no seu gerenciador de banco de dados.

---

## 📐 Regras de Negócio e Cálculos do Desmonte
Durante a análise gravimétrica de um lote:
* **Peso Perdido** = Peso Inicial - Soma de todos os Componentes.
* **Composição %** = (Peso do Componente / Peso Inicial) * 100%.
* **Integração de Estoque**: Quando uma análise é finalizada e aprovada (Modo APROVADO), o peso proporcional de cada material detectado na composição é somado diretamente ao estoque da planta.
