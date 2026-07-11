import { PrismaClient, Perfil, StatusAmostra } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Criar Usuários com Perfis Diferentes
  const senhaHash = await bcrypt.hash('apex123', 10);
  
  const usuarios = [
    { nome: 'Ana Souza', email: 'admin@apextech.com.br', perfil: Perfil.ADMIN },
    { nome: 'Carlos Silva', email: 'lab@apextech.com.br', perfil: Perfil.LAB },
    { nome: 'Mariana Costa', email: 'compras@apextech.com.br', perfil: Perfil.COMPRAS },
    { nome: 'Roberto Lima', email: 'producao@apextech.com.br', perfil: Perfil.PROD },
    { nome: 'Eduardo Santos', email: 'financeiro@apextech.com.br', perfil: Perfil.FIN },
    { nome: 'Helena Abreu', email: 'diretoria@apextech.com.br', perfil: Perfil.DIR }
  ];

  const dbUsuarios = [];
  for (const u of usuarios) {
    const user = await prisma.usuario.upsert({
      where: { email: u.email },
      update: {},
      create: {
        nome: u.nome,
        email: u.email,
        senha: senhaHash,
        perfil: u.perfil,
        ativo: true
      }
    });
    dbUsuarios.push(user);
  }
  console.log(`Created ${dbUsuarios.length} users.`);

  // 2. Criar Materiais e Inicializar Estoque
  const materiais = [
    { nome: 'Cobre', categoria: 'Metais Nobres', unidade: 'kg', corHex: '#B87333', obs: 'Alta pureza, reciclável' },
    { nome: 'Alumínio', categoria: 'Metais Comuns', unidade: 'kg', corHex: '#C0C0C0', obs: 'Latinhas, perfis, cabos' },
    { nome: 'Ferro', categoria: 'Metais Comuns', unidade: 'kg', corHex: '#4682B4', obs: 'Sucatas pesadas' },
    { nome: 'Plástico', categoria: 'Polímeros', unidade: 'kg', corHex: '#1E90FF', obs: 'PVC, PEAD, PP' },
    { nome: 'Inox', categoria: 'Ligas Metálicas', unidade: 'kg', corHex: '#D3D3D3', obs: 'Aço inoxidável' },
    { nome: 'Latão', categoria: 'Ligas Metálicas', unidade: 'kg', corHex: '#EEDC82', obs: 'Apara de latão' },
    { nome: 'Estanho', categoria: 'Metais Nobres', unidade: 'kg', corHex: '#E6E6FA', obs: 'Solda, blocos' },
    { nome: 'Níquel', categoria: 'Metais Nobres', unidade: 'kg', corHex: '#708090', obs: 'Baterias, ligas especiais' },
    { nome: 'Ouro', categoria: 'Metais Preciosos', unidade: 'g', corHex: '#FFD700', obs: 'Placas de circuito impresso' },
    { nome: 'Prata', categoria: 'Metais Preciosos', unidade: 'g', corHex: '#E6E8FA', obs: 'Contatos elétricos' },
    { nome: 'Paládio', categoria: 'Metais Preciosos', unidade: 'g', corHex: '#D8D8D8', obs: 'Catalisadores' },
    { nome: 'Componentes eletrônicos', categoria: 'Sucata Tecnológica', unidade: 'kg', corHex: '#228B22', obs: 'Placas-mãe, conectores' },
    { nome: 'Outros', categoria: 'Outros', unidade: 'kg', corHex: '#808080', obs: 'Resíduos diversos' }
  ];

  const dbMateriais = [];
  for (const m of materiais) {
    const mat = await prisma.material.upsert({
      where: { nome: m.nome },
      update: {},
      create: {
        nome: m.nome,
        categoria: m.categoria,
        unidade: m.unidade,
        corHex: m.corHex,
        observacoes: m.obs,
        estoque: {
          create: {
            quantidade: Math.floor(Math.random() * 500) + 100
          }
        }
      }
    });
    dbMateriais.push(mat);
  }
  console.log(`Created ${dbMateriais.length} materials with initial stock.`);

  // 3. Criar Fornecedores
  const fornecedores = [
    { razaoSocial: 'Recicla Brasil Ltda', nomeFantasia: 'Recicla Brasil', cnpj: '12.345.678/0001-90', contato: 'Marcos Pinheiro', telefone: '(11) 98765-4321', email: 'contato@reciclabrasil.com.br', endereco: 'Av. Industrial, 1500, Santo André - SP', obs: 'Fornecedor frequente de cobre e alumínio' },
    { razaoSocial: 'Metais do Sul S.A.', nomeFantasia: 'Metais do Sul', cnpj: '98.765.432/0001-21', contato: 'Clara Albuquerque', telefone: '(51) 3214-5566', email: 'vendas@metaisdosul.com.br', endereco: 'Rua das Fundições, 320, Porto Alegre - RS', obs: 'Ótima qualidade de ligas metálicas' },
    { razaoSocial: 'E-Waste Solutions Descarte Eletrônico', nomeFantasia: 'E-Waste Solutions', cnpj: '45.678.901/0001-34', contato: 'Thiago Nogueira', telefone: '(21) 3045-8899', email: 'parcerias@ewaste.com.br', endereco: 'Rodovia Washington Luiz, km 12, Duque de Caxias - RJ', obs: 'Fornecedor focado em sucatas eletrônicas e metais preciosos' }
  ];

  const dbFornecedores = [];
  for (const f of fornecedores) {
    const forn = await prisma.fornecedor.upsert({
      where: { cnpj: f.cnpj },
      update: {},
      create: {
        razaoSocial: f.razaoSocial,
        nomeFantasia: f.nomeFantasia,
        cnpj: f.cnpj,
        contato: f.contato,
        telefone: f.telefone,
        email: f.email,
        endereco: f.endereco,
        observacoes: f.obs
      }
    });
    dbFornecedores.push(forn);
  }
  console.log(`Created ${dbFornecedores.length} suppliers.`);

  // 4. Criar Amostras e Componentes (Seed de histórico)
  const amostrasExemplo = [
    {
      numeroAmostra: 'AM-2026-001',
      fornecedor: dbFornecedores[0],
      responsavel: dbUsuarios[1], // Carlos (Lab)
      pesoInicial: 10.0,
      status: StatusAmostra.APROVADO,
      componentes: [
        { materialName: 'Cobre', peso: 4.5, percentual: 45.0 },
        { materialName: 'Plástico', peso: 3.0, percentual: 30.0 },
        { materialName: 'Alumínio', peso: 2.0, percentual: 20.0 },
        { materialName: 'Outros', peso: 0.3, percentual: 3.0 },
      ]
    },
    {
      numeroAmostra: 'AM-2026-002',
      fornecedor: dbFornecedores[1],
      responsavel: dbUsuarios[1],
      pesoInicial: 25.0,
      status: StatusAmostra.FINALIZADO,
      componentes: [
        { materialName: 'Ferro', peso: 15.0, percentual: 60.0 },
        { materialName: 'Inox', peso: 5.0, percentual: 20.0 },
        { materialName: 'Latão', peso: 4.0, percentual: 16.0 },
        { materialName: 'Outros', peso: 0.5, percentual: 2.0 },
      ]
    },
    {
      numeroAmostra: 'AM-2026-003',
      fornecedor: dbFornecedores[2],
      responsavel: dbUsuarios[1],
      pesoInicial: 5.0,
      status: StatusAmostra.EM_ANALISE,
      componentes: [
        { materialName: 'Componentes eletrônicos', peso: 3.5, percentual: 70.0 },
        { materialName: 'Plástico', peso: 1.0, percentual: 20.0 },
      ]
    }
  ];

  for (const am of amostrasExemplo) {
    const amostra = await prisma.amostra.upsert({
      where: { numeroAmostra: am.numeroAmostra },
      update: {},
      create: {
        numeroAmostra: am.numeroAmostra,
        fornecedorId: am.fornecedor.id,
        responsavelId: am.responsavel.id,
        pesoInicial: am.pesoInicial,
        status: am.status,
        observacoes: 'Amostra de teste importada via seed.'
      }
    });

    for (const comp of am.componentes) {
      const mat = dbMateriais.find(m => m.nome === comp.materialName);
      if (mat) {
        await prisma.componenteAmostra.create({
          data: {
            amostraId: amostra.id,
            materialId: mat.id,
            peso: comp.peso,
            percentual: comp.percentual,
            observacoes: 'Auto-gerado via seed'
          }
        });
      }
    }
  }

  console.log('Seed database completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
