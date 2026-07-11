import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'apextech-secret-token-key-12345';

// ---------------------------------------------------------
// RECURSO DE BANCO DE DADOS EM MEMÓRIA (FALLBACK)
// Caso o PostgreSQL não esteja conectado, o app não crashará.
// ---------------------------------------------------------
let useMock = false;
let mockUsers: any[] = [];
let mockSuppliers: any[] = [];
let mockMaterials: any[] = [];
let mockStock: any[] = [];
let mockSamples: any[] = [];
let mockLogs: any[] = [];
let mockPermissoes: any = {
  ADMIN: { dashboard: true, analises: true, historico: true, fornecedores: true, materiais: true, estoque: true, auditoria: true, usuarios: true },
  LAB: { dashboard: true, analises: true, historico: true, fornecedores: false, materiais: true, estoque: false, auditoria: false, usuarios: false },
  COMPRAS: { dashboard: true, analises: false, historico: true, fornecedores: true, materiais: false, estoque: true, auditoria: false, usuarios: false },
  PROD: { dashboard: true, analises: false, historico: true, fornecedores: false, materiais: true, estoque: true, auditoria: false, usuarios: false },
  FIN: { dashboard: true, analises: false, historico: true, fornecedores: false, materiais: false, estoque: true, auditoria: false, usuarios: false },
  DIR: { dashboard: true, analises: false, historico: true, fornecedores: true, materiais: false, estoque: true, auditoria: true, usuarios: false }
};

async function initializeMockData() {
  const hash = await bcrypt.hash('apex123', 10);
  mockUsers = [
    { id: 'usr-1', nome: 'Ana Souza', email: 'admin@apextech.com.br', senha: hash, perfil: 'ADMIN', ativo: true },
    { id: 'usr-2', nome: 'Carlos Silva', email: 'lab@apextech.com.br', senha: hash, perfil: 'LAB', ativo: true },
    { id: 'usr-3', nome: 'Mariana Costa', email: 'compras@apextech.com.br', senha: hash, perfil: 'COMPRAS', ativo: true },
    { id: 'usr-4', nome: 'Helena Abreu', email: 'diretoria@apextech.com.br', senha: hash, perfil: 'DIR', ativo: true }
  ];

  mockSuppliers = [
    { id: 'forn-1', razaoSocial: 'Recicla Brasil Ltda', nomeFantasia: 'Recicla Brasil', cnpj: '12.345.678/0001-90', contato: 'Marcos Pinheiro', telefone: '(11) 98765-4321', email: 'contato@reciclabrasil.com.br', endereco: 'Av. Industrial, 1500 - SP', observacoes: 'Parceiro estratégico' },
    { id: 'forn-2', nomeFantasia: 'Metais do Sul S.A.', nomeFantasiaOriginal: 'Metais do Sul', razaoSocial: 'Metais do Sul S.A.', cnpj: '98.765.432/0001-21', contato: 'Clara Albuquerque', telefone: '(51) 3214-5566', email: 'vendas@metaisdosul.com.br', endereco: 'Rua das Fundições, 320 - RS', observacoes: 'Excelente cotação' }
  ];

  mockMaterials = [
    { id: 'mat-1', nome: 'Cobre', categoria: 'Metais Nobres', unidade: 'kg', corHex: '#B87333', observacoes: 'Alta pureza' },
    { id: 'mat-2', nome: 'Alumínio', categoria: 'Metais Comuns', unidade: 'kg', corHex: '#C0C0C0', observacoes: 'Latinhas e perfis' },
    { id: 'mat-3', nome: 'Ferro', categoria: 'Metais Comuns', unidade: 'kg', corHex: '#4682B4', observacoes: 'Sucata pesada' },
    { id: 'mat-4', nome: 'Plástico', categoria: 'Polímeros', unidade: 'kg', corHex: '#1E90FF', observacoes: 'PVC, PEAD' },
    { id: 'mat-5', nome: 'Inox', categoria: 'Ligas Metálicas', unidade: 'kg', corHex: '#D3D3D3', observacoes: 'Aço inoxidável' },
    { id: 'mat-6', nome: 'Componentes eletrônicos', categoria: 'Sucata Tecnológica', unidade: 'kg', corHex: '#228B22', observacoes: 'Placas de circuito' }
  ];

  mockStock = [
    { id: 'est-1', materialId: 'mat-1', quantidade: 450.0 },
    { id: 'est-2', materialId: 'mat-2', quantidade: 120.0 },
    { id: 'est-3', materialId: 'mat-3', quantidade: 1500.0 },
    { id: 'est-4', materialId: 'mat-4', quantidade: 300.0 },
    { id: 'est-5', materialId: 'mat-5', quantidade: 250.0 },
    { id: 'est-6', materialId: 'mat-6', quantidade: 80.0 }
  ];

  mockSamples = [
    {
      id: 'am-1',
      numeroAmostra: 'AM-2026-001',
      data: new Date('2026-07-10T14:00:00Z'),
      fornecedorId: 'forn-1',
      responsavelId: 'usr-2',
      pesoInicial: 10.0,
      observacoes: 'Amostra inicial de sucatas mistas.',
      status: 'APROVADO',
      componentes: [
        { id: 'comp-1', materialId: 'mat-1', peso: 4.5, percentual: 45.0, observacoes: 'Fios descascados' },
        { id: 'comp-2', materialId: 'mat-4', peso: 3.0, percentual: 30.0, observacoes: 'Isolamentos de cabos' },
        { id: 'comp-3', materialId: 'mat-2', peso: 2.0, percentual: 20.0, observacoes: 'Condutores alumínio' },
        { id: 'comp-4', materialId: 'mat-6', peso: 0.5, percentual: 5.0, observacoes: 'Resíduos finos' }
      ]
    }
  ];

  mockLogs = [
    { id: 'log-1', usuarioId: 'usr-1', acao: 'LOGIN', detalhes: 'Admin logado com sucesso', dataHora: new Date() }
  ];
}

// Tentar conectar ao banco de dados real
prisma.$connect()
  .then(() => {
    console.log('PostgreSQL database connected via Prisma ORM.');
  })
  .catch(async (err) => {
    console.warn('PostgreSQL connection failed. Falling back to IN-MEMORY Mock Database.');
    useMock = true;
    await initializeMockData();
  });

// Helper para logs de auditoria
async function registrarLog(usuarioId: string, acao: string, detalhes: string) {
  const data = { usuarioId, acao, detalhes, dataHora: new Date() };
  if (useMock) {
    mockLogs.push({ id: `log-${Date.now()}`, ...data });
  } else {
    try {
      await prisma.logAuditoria.create({ data });
    } catch (e) {
      console.error('Error logging to database:', e);
    }
  }
}

// Middleware de Autenticação JWT
function autenticarToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Token de autenticação não fornecido' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });
    req.user = user;
    next();
  });
}

// ---------------------------------------------------------
// ROTAS DE AUTENTICAÇÃO
// ---------------------------------------------------------
app.post('/api/auth/login', async (req: any, res: any) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });

  try {
    let user;
    if (useMock) {
      user = mockUsers.find(u => u.email === email);
    } else {
      user = await prisma.usuario.findUnique({ where: { email } });
    }

    if (!user || !(await bcrypt.compare(senha, user.senha))) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (!user.ativo) {
      return res.status(403).json({ error: 'Usuário inativo' });
    }

    const token = jwt.sign({ id: user.id, nome: user.nome, email: user.email, perfil: user.perfil }, JWT_SECRET, { expiresIn: '8h' });
    
    await registrarLog(user.id, 'LOGIN', `Usuário ${user.nome} logou.`);

    res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// ROTAS DE FORNECEDORES
// ---------------------------------------------------------
app.get('/api/fornecedores', async (req: any, res: any) => {
  try {
    if (useMock) {
      res.json(mockSuppliers);
    } else {
      const fornecedores = await prisma.fornecedor.findMany({ orderBy: { createdAt: 'desc' } });
      res.json(fornecedores);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/fornecedores', autenticarToken, async (req: any, res: any) => {
  const { razaoSocial, nomeFantasia, cnpj, contato, telefone, email, endereco, observacoes } = req.body;
  try {
    let newForn;
    if (useMock) {
      newForn = { id: `forn-${Date.now()}`, razaoSocial, nomeFantasia, cnpj, contato, telefone, email, endereco, observacoes, createdAt: new Date() };
      mockSuppliers.push(newForn);
    } else {
      newForn = await prisma.fornecedor.create({
        data: { razaoSocial, nomeFantasia, cnpj, contato, telefone, email, endereco, observacoes }
      });
    }
    await registrarLog(req.user.id, 'CADASTRO_FORNECEDOR', `Cadastrou fornecedor: ${nomeFantasia}`);
    res.status(201).json(newForn);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// ROTAS DE MATERIAIS E ESTOQUE
// ---------------------------------------------------------
app.get('/api/materiais', async (req: any, res: any) => {
  try {
    if (useMock) {
      res.json(mockMaterials);
    } else {
      const materiais = await prisma.material.findMany({ include: { estoque: true } });
      res.json(materiais);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/materiais', autenticarToken, async (req: any, res: any) => {
  const { nome, categoria, unidade, corHex, observacoes } = req.body;
  try {
    let newMat;
    if (useMock) {
      newMat = { id: `mat-${Date.now()}`, nome, categoria, unidade, corHex, observacoes };
      mockMaterials.push(newMat);
      mockStock.push({ id: `est-${Date.now()}`, materialId: newMat.id, quantidade: 0.0 });
    } else {
      newMat = await prisma.material.create({
        data: {
          nome, categoria, unidade, corHex, observacoes,
          estoque: { create: { quantidade: 0.0 } }
        },
        include: { estoque: true }
      });
    }
    await registrarLog(req.user.id, 'CADASTRO_MATERIAL', `Cadastrou material: ${nome}`);
    res.status(201).json(newMat);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/estoque', async (req: any, res: any) => {
  try {
    if (useMock) {
      const stockWithDetails = mockStock.map(s => {
        const mat = mockMaterials.find(m => m.id === s.materialId);
        return { ...s, material: mat };
      });
      res.json(stockWithDetails);
    } else {
      const estoque = await prisma.estoque.findMany({ include: { material: true } });
      res.json(estoque);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// ROTAS DE AMOSTRAS E ANÁLISE
// ---------------------------------------------------------
app.get('/api/amostras', async (req: any, res: any) => {
  try {
    if (useMock) {
      const samplesWithDetails = mockSamples.map(s => {
        const forn = mockSuppliers.find(f => f.id === s.fornecedorId);
        const resp = mockUsers.find(u => u.id === s.responsavelId);
        const compsWithDetails = s.componentes.map((c: any) => {
          const mat = mockMaterials.find(m => m.id === c.materialId);
          return { ...c, material: mat };
        });
        return { ...s, fornecedor: forn, responsavel: resp, componentes: compsWithDetails };
      });
      res.json(samplesWithDetails);
    } else {
      const amostras = await prisma.amostra.findMany({
        include: {
          fornecedor: true,
          responsavel: true,
          componentes: { include: { material: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(amostras);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/amostras', autenticarToken, async (req: any, res: any) => {
  const { numeroAmostra, fornecedorId, pesoInicial, observacoes, fotoUrl, componentes, grauDificuldade, tempoRealizacao } = req.body;
  try {
    let newSample;
    const compsData = componentes || [];

    if (useMock) {
      newSample = {
        id: `am-${Date.now()}`,
        numeroAmostra,
        data: new Date(),
        fornecedorId,
        responsavelId: req.user.id,
        pesoInicial: parseFloat(pesoInicial),
        observacoes,
        fotoUrl,
        status: 'EM_ANALISE',
        grauDificuldade,
        tempoRealizacao,
        componentes: compsData.map((c: any) => ({
          id: `comp-${Date.now()}-${Math.random()}`,
          materialId: c.materialId,
          peso: parseFloat(c.peso),
          percentual: parseFloat(c.percentual),
          observacoes: c.observacoes,
          fotoUrl: c.fotoUrl
        }))
      };
      mockSamples.push(newSample);
    } else {
      newSample = await prisma.amostra.create({
        data: {
          numeroAmostra,
          fornecedorId,
          responsavelId: req.user.id,
          pesoInicial: parseFloat(pesoInicial),
          observacoes,
          fotoUrl,
          status: 'EM_ANALISE',
          grauDificuldade,
          tempoRealizacao,
          componentes: {
            create: compsData.map((c: any) => ({
              materialId: c.materialId,
              peso: parseFloat(c.peso),
              percentual: parseFloat(c.percentual),
              observacoes: c.observacoes,
              fotoUrl: c.fotoUrl
            }))
          }
        },
        include: { componentes: true }
      });
    }

    await registrarLog(req.user.id, 'CRIACAO_AMOSTRA', `Criou amostra ${numeroAmostra}`);
    res.status(201).json(newSample);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/amostras/:id/status', autenticarToken, async (req: any, res: any) => {
  const { id } = req.params;
  const { status, observacaoAdmin } = req.body;
  try {
    let sample;
    if (useMock) {
      sample = mockSamples.find(s => s.id === id);
      if (sample) {
        sample.status = status;
        if (observacaoAdmin) {
          sample.observacaoAdmin = observacaoAdmin;
        }
      }
    } else {
      sample = await prisma.amostra.update({
        where: { id },
        data: { status, observacaoAdmin },
        include: { componentes: true }
      });
    }

    if (!sample) return res.status(404).json({ error: 'Amostra não encontrada' });

    // Atualização Inteligente do Estoque quando APROVADO ou APROVADO_CONDICIONAL
    if (status === 'APROVADO' || status === 'APROVADO_CONDICIONAL') {
      const weightMultiplier = sample.pesoInicial; // Peso do lote total
      for (const comp of sample.componentes) {
        const adicaoEstoque = (comp.percentual / 100) * weightMultiplier;
        if (useMock) {
          const est = mockStock.find(s => s.materialId === comp.materialId);
          if (est) est.quantidade += adicaoEstoque;
        } else {
          await prisma.estoque.update({
            where: { materialId: comp.materialId },
            data: { quantidade: { increment: adicaoEstoque } }
          });
        }
      }
      await registrarLog(req.user.id, 'APROVACAO_LAUDO', `Aprovou amostra ${sample.numeroAmostra} (${status}). Estoque atualizado.`);
    } else {
      await registrarLog(req.user.id, 'ATUALIZACAO_AMOSTRA', `Atualizou status da amostra ${sample.numeroAmostra} para ${status}`);
    }

    res.json(sample);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// ROTAS DE USUÁRIOS E PERMISSÕES (DINÂMICO)
// ---------------------------------------------------------
app.get('/api/usuarios', autenticarToken, async (req: any, res: any) => {
  try {
    if (useMock) {
      res.json(mockUsers);
    } else {
      const users = await prisma.usuario.findMany({ orderBy: { nome: 'asc' } });
      res.json(users);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/usuarios', autenticarToken, async (req: any, res: any) => {
  const { nome, email, senha, perfil } = req.body;
  try {
    const hash = await bcrypt.hash(senha || 'apex123', 10);
    let newUser;
    if (useMock) {
      newUser = { id: `usr-${Date.now()}`, nome, email, senha: hash, perfil, ativo: true, createdAt: new Date() };
      mockUsers.push(newUser);
    } else {
      newUser = await prisma.usuario.create({
        data: { nome, email, senha: hash, perfil, ativo: true }
      });
    }
    await registrarLog(req.user.id, 'CRIACAO_USUARIO', `Criou usuário ${nome} (${perfil})`);
    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/usuarios/:id', autenticarToken, async (req: any, res: any) => {
  const { id } = req.params;
  const { nome, email, perfil, ativo } = req.body;
  try {
    let user;
    if (useMock) {
      user = mockUsers.find(u => u.id === id);
      if (user) {
        if (nome !== undefined) user.nome = nome;
        if (email !== undefined) user.email = email;
        if (perfil !== undefined) user.perfil = perfil;
        if (ativo !== undefined) user.ativo = ativo;
      }
    } else {
      user = await prisma.usuario.update({
        where: { id },
        data: { nome, email, perfil, ativo }
      });
    }
    await registrarLog(req.user.id, 'ATUALIZACAO_USUARIO', `Atualizou usuário ${nome || id}`);
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/permissoes', autenticarToken, async (req: any, res: any) => {
  res.json(mockPermissoes);
});

app.put('/api/permissoes', autenticarToken, async (req: any, res: any) => {
  const { permissoes } = req.body;
  mockPermissoes = permissoes;
  await registrarLog(req.user.id, 'ATUALIZACAO_PERMISSOES', `Atualizou tabela de permissões de perfis`);
  res.json({ success: true });
});

app.get('/api/logs', autenticarToken, async (req: any, res: any) => {
  try {
    if (useMock) {
      const logsWithUser = mockLogs.map(l => {
        const usr = mockUsers.find(u => u.id === l.usuarioId);
        return { ...l, usuario: usr };
      });
      res.json(logsWithUser);
    } else {
      const logs = await prisma.logAuditoria.findMany({
        include: { usuario: true },
        orderBy: { dataHora: 'desc' }
      });
      res.json(logs);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// SERVIR FRONTEND ESTÁTICO EM PRODUÇÃO
// ---------------------------------------------------------
app.use(express.static(path.join(__dirname, '../../frontend/dist')));
app.get('*', (req: any, res: any, next: any) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// Porta do Servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`APEXTECH API running on http://localhost:${PORT}`);
});
