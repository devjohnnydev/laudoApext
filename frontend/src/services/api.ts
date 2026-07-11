import { Fornecedor, Material, Amostra, Estoque, LogAuditoria, Usuario, Perfil, StatusAmostra, PermissoesPerfil } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 
  (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? 'http://localhost:4000/api' 
    : `${window.location.origin}/api`);

// Fallback Local Storage Data
const defaultMaterials: Material[] = [
  { id: 'mat-1', nome: 'Cobre', categoria: 'Metais Nobres', unidade: 'kg', corHex: '#B87333', observacoes: 'Alta pureza' },
  { id: 'mat-2', nome: 'Alumínio', categoria: 'Metais Comuns', unidade: 'kg', corHex: '#C0C0C0', observacoes: 'Latinhas e perfis' },
  { id: 'mat-3', nome: 'Ferro', categoria: 'Metais Comuns', unidade: 'kg', corHex: '#4682B4', observacoes: 'Sucata pesada' },
  { id: 'mat-4', nome: 'Plástico', categoria: 'Polímeros', unidade: 'kg', corHex: '#1E90FF', observacoes: 'PVC, PEAD' },
  { id: 'mat-5', nome: 'Inox', categoria: 'Ligas Metálicas', unidade: 'kg', corHex: '#D3D3D3', observacoes: 'Aço inoxidável' },
  { id: 'mat-6', nome: 'Latão', categoria: 'Ligas Metálicas', unidade: 'kg', corHex: '#EEDC82', observacoes: 'Apara de latão' },
  { id: 'mat-7', nome: 'Estanho', categoria: 'Metais Nobres', unidade: 'kg', corHex: '#E6E6FA', observacoes: 'Soldas' },
  { id: 'mat-8', nome: 'Componentes eletrônicos', categoria: 'Sucata Tecnológica', unidade: 'kg', corHex: '#228B22', observacoes: 'Placas de circuito' },
  { id: 'mat-9', nome: 'Outros', categoria: 'Outros', unidade: 'kg', corHex: '#808080', observacoes: 'Resíduos diversos' }
];

const defaultSuppliers: Fornecedor[] = [
  { id: 'forn-1', razaoSocial: 'Recicla Brasil Ltda', nomeFantasia: 'Recicla Brasil', cnpj: '12.345.678/0001-90', contato: 'Marcos Pinheiro', telefone: '(11) 98765-4321', email: 'contato@reciclabrasil.com.br', endereco: 'Av. Industrial, 1500 - SP', observacoes: 'Parceiro recorrente' },
  { id: 'forn-2', razaoSocial: 'Metais do Sul S.A.', nomeFantasia: 'Metais do Sul', cnpj: '98.765.432/0001-21', contato: 'Clara Albuquerque', telefone: '(51) 3214-5566', email: 'vendas@metaisdosul.com.br', endereco: 'Rua das Fundições, 320 - RS', observacoes: 'Metais nobres de alta qualidade' }
];

const defaultStock: Estoque[] = [
  { id: 'est-1', materialId: 'mat-1', quantidade: 450.0 },
  { id: 'est-2', materialId: 'mat-2', quantidade: 120.0 },
  { id: 'est-3', materialId: 'mat-3', quantidade: 1500.0 },
  { id: 'est-4', materialId: 'mat-4', quantidade: 300.0 },
  { id: 'est-5', materialId: 'mat-5', quantidade: 250.0 },
  { id: 'est-6', materialId: 'mat-6', quantidade: 190.0 },
  { id: 'est-7', materialId: 'mat-7', quantidade: 45.0 },
  { id: 'est-8', materialId: 'mat-8', quantidade: 80.0 },
  { id: 'est-9', materialId: 'mat-9', quantidade: 10.0 }
];

const defaultSamples: Amostra[] = [
  {
    id: 'am-1',
    numeroAmostra: 'AM-2026-001',
    data: new Date('2026-07-10T10:00:00Z').toISOString(),
    fornecedorId: 'forn-1',
    responsavelId: 'usr-2',
    pesoInicial: 10.0,
    observacoes: 'Amostra de cabos elétricos com isolamento.',
    status: 'APROVADO',
    componentes: [
      { materialId: 'mat-1', peso: 4.5, percentual: 45.0, observacoes: 'Cobre limpo descascado' },
      { materialId: 'mat-4', peso: 3.0, percentual: 30.0, observacoes: 'Capa plástica PVC' },
      { materialId: 'mat-2', peso: 2.0, percentual: 20.0, observacoes: 'Alumínio de blindagem' },
      { materialId: 'mat-9', peso: 0.5, percentual: 5.0, observacoes: 'Perda/Resíduos inertes' }
    ]
  },
  {
    id: 'am-2',
    numeroAmostra: 'AM-2026-002',
    data: new Date('2026-07-11T09:30:00Z').toISOString(),
    fornecedorId: 'forn-2',
    responsavelId: 'usr-2',
    pesoInicial: 50.0,
    observacoes: 'Lote de bobinas industriais e sucatas de solda.',
    status: 'FINALIZADO',
    componentes: [
      { materialId: 'mat-3', peso: 30.0, percentual: 60.0, observacoes: 'Núcleo ferroso pesado' },
      { materialId: 'mat-6', peso: 10.0, percentual: 20.0, observacoes: 'Conectores de latão' },
      { materialId: 'mat-7', peso: 8.0, percentual: 16.0, observacoes: 'Liga de estanho de soldas' },
      { materialId: 'mat-9', peso: 2.0, percentual: 4.0, observacoes: 'Pó e impurezas' }
    ]
  }
];

const defaultLogs: LogAuditoria[] = [
  { id: 'log-1', usuarioId: 'usr-2', acao: 'LOGIN', detalhes: 'Usuário Carlos Silva iniciou sessão no terminal lab.', dataHora: new Date().toISOString() }
];

const defaultUsers: Usuario[] = [
  { id: 'usr-1', nome: 'Ana Souza', email: 'admin@apextech.com.br', perfil: 'ADMIN', ativo: true },
  { id: 'usr-2', nome: 'Carlos Silva', email: 'lab@apextech.com.br', perfil: 'LAB', ativo: true },
  { id: 'usr-3', nome: 'Mariana Costa', email: 'compras@apextech.com.br', perfil: 'COMPRAS', ativo: true },
  { id: 'usr-4', nome: 'Roberto Lima', email: 'producao@apextech.com.br', perfil: 'PROD', ativo: true },
  { id: 'usr-5', nome: 'Eduardo Santos', email: 'financeiro@apextech.com.br', perfil: 'FIN', ativo: true },
  { id: 'usr-6', nome: 'Helena Abreu', email: 'diretoria@apextech.com.br', perfil: 'DIR', ativo: true }
];

const defaultPermissoes: Record<Perfil, PermissoesPerfil> = {
  ADMIN: { dashboard: true, analises: true, historico: true, fornecedores: true, materiais: true, estoque: true, auditoria: true, usuarios: true },
  LAB: { dashboard: true, analises: true, historico: true, fornecedores: false, materiais: true, estoque: false, auditoria: false, usuarios: false },
  COMPRAS: { dashboard: true, analises: false, historico: true, fornecedores: true, materiais: false, estoque: true, auditoria: false, usuarios: false },
  PROD: { dashboard: true, analises: false, historico: true, fornecedores: false, materiais: true, estoque: true, auditoria: false, usuarios: false },
  FIN: { dashboard: true, analises: false, historico: true, fornecedores: false, materiais: false, estoque: true, auditoria: false, usuarios: false },
  DIR: { dashboard: true, analises: false, historico: true, fornecedores: true, materiais: false, estoque: true, auditoria: true, usuarios: false }
};

// Instanciar do Local Storage ou default
function getLocalStorage<T>(key: string, defaultValue: T): T {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(data);
}

function setLocalStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Inicializar local storage fallbacks
let localSuppliers = getLocalStorage<Fornecedor[]>('apex_suppliers', defaultSuppliers);
let localMaterials = getLocalStorage<Material[]>('apex_materials', defaultMaterials);
let localStock = getLocalStorage<Estoque[]>('apex_stock', defaultStock);
let localSamples = getLocalStorage<Amostra[]>('apex_samples', defaultSamples);
let localLogs = getLocalStorage<LogAuditoria[]>('apex_logs', defaultLogs);
let localUsers = getLocalStorage<Usuario[]>('apex_users', defaultUsers);
let localPermissoes = getLocalStorage<Record<Perfil, PermissoesPerfil>>('apex_permissions', defaultPermissoes);
let currentUser = getLocalStorage<Usuario>('apex_current_user', defaultUsers[1]); // Carlos (Lab) default

export const api = {
  // Autenticação / Perfis
  getCurrentUser: (): Usuario => {
    return currentUser;
  },
  
  switchUser: (perfil: Perfil): Usuario => {
    const user = localUsers.find(u => u.perfil === perfil) || localUsers[0];
    currentUser = user;
    setLocalStorage('apex_current_user', user);
    api.addLog('SWITCH_USER', `Alterou perfil de acesso para ${perfil}`);
    return user;
  },

  getUsers: (): Usuario[] => {
    return localUsers;
  },

  createUser: (user: Omit<Usuario, 'id'>): Usuario => {
    const newUser = { ...user, id: `usr-${Date.now()}` };
    localUsers.push(newUser);
    setLocalStorage('apex_users', localUsers);
    api.addLog('CRIACAO_USUARIO', `Criou usuário ${newUser.nome} (${newUser.perfil})`);
    return newUser;
  },

  updateUser: (id: string, updatedFields: Partial<Usuario>): Usuario | null => {
    const index = localUsers.findIndex(u => u.id === id);
    if (index === -1) return null;
    localUsers[index] = { ...localUsers[index], ...updatedFields };
    setLocalStorage('apex_users', localUsers);
    api.addLog('ATUALIZACAO_USUARIO', `Atualizou usuário ${localUsers[index].nome}`);
    return localUsers[index];
  },

  getPermissoes: (): Record<Perfil, PermissoesPerfil> => {
    return localPermissoes;
  },

  updatePermissoes: (perms: Record<Perfil, PermissoesPerfil>) => {
    localPermissoes = perms;
    setLocalStorage('apex_permissions', perms);
    api.addLog('ATUALIZACAO_PERMISSOES', `Atualizou tabela de permissões de perfis`);
  },

  // Fornecedores
  getFornecedores: async (): Promise<Fornecedor[]> => {
    try {
      const res = await fetch(`${API_BASE}/fornecedores`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, using LocalStorage for Fornecedores');
    }
    return localSuppliers;
  },

  createFornecedor: async (forn: Omit<Fornecedor, 'id'>): Promise<Fornecedor> => {
    const newForn = { ...forn, id: `forn-${Date.now()}`, createdAt: new Date().toISOString() } as Fornecedor;
    try {
      const res = await fetch(`${API_BASE}/fornecedores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer fake-token` },
        body: JSON.stringify(forn)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, saving supplier to LocalStorage');
    }
    localSuppliers.unshift(newForn);
    setLocalStorage('apex_suppliers', localSuppliers);
    api.addLog('CADASTRO_FORNECEDOR', `Cadastrou fornecedor: ${newForn.nomeFantasia}`);
    return newForn;
  },

  createSupplier: async (forn: Omit<Fornecedor, 'id'>): Promise<Fornecedor> => {
    return api.createFornecedor(forn);
  },

  // Materiais
  getMateriais: async (): Promise<Material[]> => {
    try {
      const res = await fetch(`${API_BASE}/materiais`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, using LocalStorage for Materiais');
    }
    return localMaterials;
  },

  createMaterial: async (mat: Omit<Material, 'id'>): Promise<Material> => {
    const newMat = { ...mat, id: `mat-${Date.now()}` } as Material;
    try {
      const res = await fetch(`${API_BASE}/materiais`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer fake-token` },
        body: JSON.stringify(mat)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, saving material to LocalStorage');
    }
    localMaterials.push(newMat);
    setLocalStorage('apex_materials', localMaterials);
    
    // Add default stock entry
    localStock.push({ id: `est-${Date.now()}`, materialId: newMat.id, quantidade: 0 });
    setLocalStorage('apex_stock', localStock);

    api.addLog('CADASTRO_MATERIAL', `Cadastrou material: ${newMat.nome}`);
    return newMat;
  },

  // Estoque
  getEstoque: async (): Promise<Estoque[]> => {
    try {
      const res = await fetch(`${API_BASE}/estoque`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, using LocalStorage for Estoque');
    }
    return localStock.map(s => ({
      ...s,
      material: localMaterials.find(m => m.id === s.materialId)
    }));
  },

  // Amostras
  getAmostras: async (): Promise<Amostra[]> => {
    try {
      const res = await fetch(`${API_BASE}/amostras`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, using LocalStorage for Amostras');
    }
    return localSamples.map(s => ({
      ...s,
      fornecedor: localSuppliers.find(f => f.id === s.fornecedorId),
      responsavel: localUsers.find(u => u.id === s.responsavelId),
      componentes: s.componentes.map(c => ({
        ...c,
        material: localMaterials.find(m => m.id === c.materialId)
      }))
    })).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  },

  createAmostra: async (amostra: Omit<Amostra, 'id' | 'data' | 'status' | 'responsavelId'>): Promise<Amostra> => {
    const newAmostra: Amostra = {
      ...amostra,
      id: `am-${Date.now()}`,
      data: new Date().toISOString(),
      status: 'EM_ANALISE',
      responsavelId: currentUser.id,
      responsavel: currentUser,
      fornecedor: localSuppliers.find(f => f.id === amostra.fornecedorId)
    } as Amostra;

    try {
      const res = await fetch(`${API_BASE}/amostras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer fake-token` },
        body: JSON.stringify(amostra)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, saving sample to LocalStorage');
    }

    localSamples.unshift(newAmostra);
    setLocalStorage('apex_samples', localSamples);
    api.addLog('CRIACAO_AMOSTRA', `Criou amostra de código ${newAmostra.numeroAmostra}`);
    return newAmostra;
  },

  updateAmostraStatus: async (id: string, status: StatusAmostra, observacaoAdmin?: string): Promise<Amostra | null> => {
    try {
      const res = await fetch(`${API_BASE}/amostras/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer fake-token` },
        body: JSON.stringify({ status, observacaoAdmin })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, updating sample status locally');
    }

    const index = localSamples.findIndex(s => s.id === id);
    if (index === -1) return null;

    const sample = localSamples[index];
    sample.status = status;
    if (observacaoAdmin) {
      sample.observacaoAdmin = observacaoAdmin;
    }

    // Se APROVADO ou APROVADO_CONDICIONAL, atualizar o estoque localmente
    if (status === 'APROVADO' || status === 'APROVADO_CONDICIONAL') {
      const multiplier = sample.pesoInicial;
      sample.componentes.forEach(comp => {
        const adicao = (comp.percentual / 100) * multiplier;
        const estIdx = localStock.findIndex(s => s.materialId === comp.materialId);
        if (estIdx !== -1) {
          localStock[estIdx].quantidade += adicao;
        } else {
          localStock.push({ id: `est-${Date.now()}`, materialId: comp.materialId, quantidade: adicao });
        }
      });
      setLocalStorage('apex_stock', localStock);
      api.addLog('APROVACAO_LAUDO', `Laudo da amostra ${sample.numeroAmostra} aprovado (${status}). Estoque incrementado.`);
    } else {
      api.addLog('ATUALIZACAO_AMOSTRA', `Atualizou status da amostra ${sample.numeroAmostra} para ${status}`);
    }

    localSamples[index] = sample;
    setLocalStorage('apex_samples', localSamples);
    return sample;
  },

  // Logs
  getLogs: async (): Promise<LogAuditoria[]> => {
    try {
      const res = await fetch(`${API_BASE}/logs`, {
        headers: { 'Authorization': `Bearer fake-token` }
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, returning LocalStorage Audit Logs');
    }
    return localLogs.map(l => ({
      ...l,
      usuario: localUsers.find(u => u.id === l.usuarioId)
    })).sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
  },

  addLog: (acao: string, detalhes: string) => {
    const newLog: LogAuditoria = {
      id: `log-${Date.now()}`,
      usuarioId: currentUser.id,
      usuario: currentUser,
      acao,
      detalhes,
      dataHora: new Date().toISOString()
    };
    localLogs.unshift(newLog);
    setLocalStorage('apex_logs', localLogs);
  }
};
