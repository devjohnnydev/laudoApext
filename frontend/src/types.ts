export type Perfil = 'ADMIN' | 'LAB' | 'COMPRAS' | 'PROD' | 'FIN' | 'DIR';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
}

export interface Fornecedor {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  contato: string;
  telefone: string;
  email: string;
  endereco: string;
  observacoes?: string;
  createdAt?: string;
}

export interface Material {
  id: string;
  nome: string;
  unidade: string;
  categoria: string;
  corHex: string;
  observacoes?: string;
}

export interface Estoque {
  id: string;
  materialId: string;
  material?: Material;
  quantidade: number;
  updatedAt?: string;
}

export interface ComponenteAmostra {
  id?: string;
  materialId: string;
  material?: Material;
  peso: number;
  percentual: number;
  observacoes?: string;
  fotoUrl?: string; // Base64 or URL
}

export type StatusAmostra = 'EM_ANALISE' | 'FINALIZADO' | 'APROVADO' | 'APROVADO_CONDICIONAL';

export interface Amostra {
  id: string;
  numeroAmostra: string;
  data: string;
  fornecedorId: string;
  fornecedor?: Fornecedor;
  responsavelId: string;
  responsavel?: Usuario;
  pesoInicial: number;
  observacoes?: string;
  fotoUrl?: string; // Base64
  status: StatusAmostra;
  codigoQR?: string;
  laudoPDFUrl?: string;
  componentes: ComponenteAmostra[];
  grauDificuldade?: string;
  tempoRealizacao?: string;
  observacaoAdmin?: string;
  createdAt?: string;
}

export interface PermissoesPerfil {
  dashboard: boolean;
  analises: boolean;
  historico: boolean;
  fornecedores: boolean;
  materiais: boolean;
  estoque: boolean;
  auditoria: boolean;
  usuarios: boolean;
}

export interface LogAuditoria {
  id: string;
  usuarioId: string;
  usuario?: Usuario;
  acao: string;
  detalhes: string;
  dataHora: string;
}
