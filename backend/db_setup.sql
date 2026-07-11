-- ==========================================
-- APEXTECH METAIS - CONFIGURAÇÃO DO POSTGRES
-- Script SQL para Criação do Banco de Dados
-- ==========================================

-- Criação de Enums
CREATE TYPE "Perfil" AS ENUM ('ADMIN', 'LAB', 'COMPRAS', 'PROD', 'FIN', 'DIR');
CREATE TYPE "StatusAmostra" AS ENUM ('EM_ANALISE', 'FINALIZADO', 'APROVADO', 'APROVADO_CONDICIONAL');

-- Tabela de Usuários
CREATE TABLE "Usuario" (
    "id" VARCHAR(36) PRIMARY KEY,
    "nome" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "perfil" "Perfil" DEFAULT 'LAB'::"Perfil" NOT NULL,
    "ativo" BOOLEAN DEFAULT TRUE NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Tabela de Fornecedores
CREATE TABLE "Fornecedor" (
    "id" VARCHAR(36) PRIMARY KEY,
    "razaoSocial" VARCHAR(255) NOT NULL,
    "nomeFantasia" VARCHAR(255) NOT NULL,
    "cnpj" VARCHAR(20) UNIQUE NOT NULL,
    "contato" VARCHAR(255) NOT NULL,
    "telefone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "endereco" TEXT NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Tabela de Materiais
CREATE TABLE "Material" (
    "id" VARCHAR(36) PRIMARY KEY,
    "nome" VARCHAR(255) UNIQUE NOT NULL,
    "unidade" VARCHAR(10) DEFAULT 'kg' NOT NULL,
    "categoria" VARCHAR(100) NOT NULL,
    "corHex" VARCHAR(7) DEFAULT '#3E7CB1' NOT NULL,
    "observacoes" TEXT
);

-- Tabela de Estoque
CREATE TABLE "Estoque" (
    "id" VARCHAR(36) PRIMARY KEY,
    "materialId" VARCHAR(36) UNIQUE NOT NULL REFERENCES "Material"("id") ON DELETE CASCADE,
    "quantidade" DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Tabela de Amostras
CREATE TABLE "Amostra" (
    "id" VARCHAR(36) PRIMARY KEY,
    "numeroAmostra" VARCHAR(100) UNIQUE NOT NULL,
    "data" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "fornecedorId" VARCHAR(36) NOT NULL REFERENCES "Fornecedor"("id") ON DELETE CASCADE,
    "responsavelId" VARCHAR(36) NOT NULL REFERENCES "Usuario"("id"),
    "pesoInicial" DOUBLE PRECISION NOT NULL,
    "observacoes" TEXT,
    "fotoUrl" TEXT,
    "status" "StatusAmostra" DEFAULT 'EM_ANALISE'::"StatusAmostra" NOT NULL,
    "codigoQR" TEXT,
    "laudoPDFUrl" TEXT,
    "grauDificuldade" VARCHAR(50),
    "tempoRealizacao" VARCHAR(100),
    "observacaoAdmin" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Tabela de Componentes das Amostras
CREATE TABLE "ComponenteAmostra" (
    "id" VARCHAR(36) PRIMARY KEY,
    "amostraId" VARCHAR(36) NOT NULL REFERENCES "Amostra"("id") ON DELETE CASCADE,
    "materialId" VARCHAR(36) NOT NULL REFERENCES "Material"("id") ON DELETE CASCADE,
    "peso" DOUBLE PRECISION NOT NULL,
    "percentual" DOUBLE PRECISION NOT NULL,
    "observacoes" TEXT,
    "fotoUrl" TEXT
);

-- Tabela de Logs de Auditoria
CREATE TABLE "LogAuditoria" (
    "id" VARCHAR(36) PRIMARY KEY,
    "usuarioId" VARCHAR(36) NOT NULL REFERENCES "Usuario"("id") ON DELETE CASCADE,
    "acao" TEXT NOT NULL,
    "detalhes" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ========================================================
-- DADOS INICIAIS (SEED) PARA TESTES
-- ========================================================

-- Usuários: Senha criptografada correspondente a 'apex123'
INSERT INTO "Usuario" ("id", "nome", "email", "senha", "perfil", "ativo") VALUES
('usr-1', 'Ana Souza', 'admin@apextech.com.br', '$2a$10$pT67zP9.eTsz13N0F6f2Nu30f7L5qg31fPjZc7rL4.L.e12345678', 'ADMIN', TRUE),
('usr-2', 'Carlos Silva', 'lab@apextech.com.br', '$2a$10$pT67zP9.eTsz13N0F6f2Nu30f7L5qg31fPjZc7rL4.L.e12345678', 'LAB', TRUE),
('usr-3', 'Mariana Costa', 'compras@apextech.com.br', '$2a$10$pT67zP9.eTsz13N0F6f2Nu30f7L5qg31fPjZc7rL4.L.e12345678', 'COMPRAS', TRUE);

-- Materiais
INSERT INTO "Material" ("id", "nome", "unidade", "categoria", "corHex", "observacoes") VALUES
('mat-1', 'Cobre', 'kg', 'Metais Nobres', '#B87333', 'Alta pureza'),
('mat-2', 'Alumínio', 'kg', 'Metais Comuns', '#C0C0C0', 'Latinhas e perfis'),
('mat-3', 'Ferro', 'kg', 'Metais Comuns', '#4682B4', 'Sucata pesada'),
('mat-4', 'Plástico', 'kg', 'Polímeros', '#1E90FF', 'PVC, PEAD'),
('mat-5', 'Inox', 'kg', 'Ligas Metálicas', '#D3D3D3', 'Aço inoxidável'),
('mat-6', 'Componentes eletrônicos', 'kg', 'Sucata Tecnológica', '#228B22', 'Placas de circuito');

-- Estoque
INSERT INTO "Estoque" ("id", "materialId", "quantidade") VALUES
('est-1', 'mat-1', 450.0),
('est-2', 'mat-2', 120.0),
('est-3', 'mat-3', 1500.0),
('est-4', 'mat-4', 300.0),
('est-5', 'mat-5', 250.0),
('est-6', 'mat-6', 80.0);

-- Fornecedores
INSERT INTO "Fornecedor" ("id", "razaoSocial", "nomeFantasia", "cnpj", "contato", "telefone", "email", "endereco", "observacoes") VALUES
('forn-1', 'Recicla Brasil Ltda', 'Recicla Brasil', '12.345.678/0001-90', 'Marcos Pinheiro', '(11) 98765-4321', 'contato@reciclabrasil.com.br', 'Av. Industrial, 1500 - SP', 'Parceiro estratégico'),
('forn-2', 'Metais do Sul S.A.', 'Metais do Sul', '98.765.432/0001-21', 'Clara Albuquerque', '(51) 3214-5566', 'vendas@metaisdosul.com.br', 'Rua das Fundições, 320 - RS', 'Excelente cotação');
