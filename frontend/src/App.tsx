import React, { useState, useEffect } from 'react';
import { 
  Trash2, FileDown, Plus, Check, RefreshCw, FileText, 
  Trash, User, Phone, CheckCircle2, QrCode, ClipboardList
} from 'lucide-react';
import { api } from './services/api';
import { Fornecedor, Material, Amostra, Estoque, LogAuditoria, Usuario, Perfil, StatusAmostra, PermissoesPerfil } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

// Chart JS imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar as BarChartReact, Pie as PieChartReact } from 'react-chartjs-2';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  ChartLegend,
  ArcElement,
  PointElement,
  LineElement
);

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Data states
  const [currentUser, setCurrentUser] = useState<Usuario>(api.getCurrentUser());
  const [suppliers, setSuppliers] = useState<Fornecedor[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stock, setStock] = useState<Estoque[]>([]);
  const [samples, setSamples] = useState<Amostra[]>([]);
  const [logs, setLogs] = useState<LogAuditoria[]>([]);

  // Selected details
  const [selectedSample, setSelectedSample] = useState<Amostra | null>(null);

  // Form states
  const [newSupplier, setNewSupplier] = useState({
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    contato: '',
    telefone: '',
    email: '',
    endereco: '',
    observacoes: ''
  });

  const [newMaterial, setNewMaterial] = useState({
    nome: '',
    categoria: 'Metais Nobres',
    unidade: 'kg',
    corHex: '#1E4E8C',
    observacoes: ''
  });

  // Analysis Form state
  const [sampleNumber, setSampleNumber] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [initialWeight, setInitialWeight] = useState<number>(0);
  const [sampleObs, setSampleObs] = useState('');
  const [samplePhoto, setSamplePhoto] = useState<string | null>(null);
  
  // Technician process fields
  const [grauDificuldade, setGrauDificuldade] = useState('Médio');
  const [tempoRealizacao, setTempoRealizacao] = useState('');

  // Observation admin fields for conditional approval
  const [observacaoAdmin, setObservacaoAdmin] = useState('');
  const [showObservationInput, setShowObservationInput] = useState(false);

  // New User Form State
  const [newUserFields, setNewUserFields] = useState({
    nome: '',
    email: '',
    senha: '',
    perfil: 'LAB' as Perfil
  });

  // Dynamic permissions and users list
  const [permissoes, setPermissoes] = useState<Record<Perfil, PermissoesPerfil>>(api.getPermissoes());
  const [allUsers, setAllUsers] = useState<Usuario[]>([]);
  
  // Unlimited components list for current analysis
  const [analysisComponents, setAnalysisComponents] = useState<Array<{
    materialId: string;
    peso: number;
    observacoes: string;
    fotoUrl: string | null;
  }>>([
    { materialId: '', peso: 0, observacoes: '', fotoUrl: null }
  ]);

  // Load Initial Data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    const sups = await api.getFornecedores();
    const mats = await api.getMateriais();
    const stk = await api.getEstoque();
    const smp = await api.getAmostras();
    const lgs = await api.getLogs();
    const usrs = api.getUsers();
    const perms = api.getPermissoes();
    
    setSuppliers(sups);
    setMaterials(mats);
    setStock(stk);
    setSamples(smp);
    setLogs(lgs);
    setAllUsers(usrs);
    setPermissoes(perms);

    // Auto generate sample number
    setSampleNumber(`AM-${new Date().getFullYear()}-${String(smp.length + 1).padStart(3, '0')}`);
  };

  const handleSwitchRole = (perfil: Perfil) => {
    const user = api.switchUser(perfil);
    setCurrentUser(user);
    loadAllData();
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    const root = window.document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  // ---------------------------------------------------------
  // ACTION HANDLERS
  // ---------------------------------------------------------
  
  // Create Supplier
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.razaoSocial || !newSupplier.cnpj) {
      alert('Razão Social e CNPJ são obrigatórios');
      return;
    }
    await api.createSupplier(newSupplier);
    setNewSupplier({
      razaoSocial: '',
      nomeFantasia: '',
      cnpj: '',
      contato: '',
      telefone: '',
      email: '',
      endereco: '',
      observacoes: ''
    });
    loadAllData();
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
  };

  // Create Material
  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.nome) {
      alert('Nome do material é obrigatório');
      return;
    }
    await api.createMaterial(newMaterial);
    setNewMaterial({
      nome: '',
      categoria: 'Metais Nobres',
      unidade: 'kg',
      corHex: '#1E4E8C',
      observacoes: ''
    });
    loadAllData();
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
  };

  // Calculations for current active analysis form
  const getAnalysisCalculations = () => {
    const totalComponentsWeight = analysisComponents.reduce((sum, item) => sum + (parseFloat(item.peso as any) || 0), 0);
    const lostWeight = Math.max(0, initialWeight - totalComponentsWeight);
    const lossPercentage = initialWeight > 0 ? (lostWeight / initialWeight) * 100 : 0;
    
    const componentsWithPct = analysisComponents.map(item => {
      const weight = parseFloat(item.peso as any) || 0;
      const percent = initialWeight > 0 ? (weight / initialWeight) * 100 : 0;
      return {
        ...item,
        percentual: percent
      };
    });

    return {
      totalComponentsWeight,
      lostWeight,
      lossPercentage,
      componentsWithPct
    };
  };

  // Nova Análise Components Management
  const handleAddAnalysisComponent = () => {
    setAnalysisComponents([
      ...analysisComponents,
      { materialId: '', peso: 0, observacoes: '', fotoUrl: null }
    ]);
  };

  const handleRemoveAnalysisComponent = (index: number) => {
    const list = [...analysisComponents];
    list.splice(index, 1);
    setAnalysisComponents(list);
  };

  const handleUpdateAnalysisComponent = (index: number, field: string, value: any) => {
    const list = [...analysisComponents];
    (list[index] as any)[field] = value;
    setAnalysisComponents(list);
  };

  // Handle Photo input (Base64)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Laboratory Analysis
  const handleSubmitAnalysis = async () => {
    if (!selectedSupplierId) {
      alert('Selecione um fornecedor.');
      return;
    }
    if (initialWeight <= 0) {
      alert('O peso inicial deve ser maior que zero.');
      return;
    }

    const { componentsWithPct, totalComponentsWeight } = getAnalysisCalculations();
    
    // STRICT WEIGHT VALIDATION
    if (totalComponentsWeight > initialWeight) {
      alert(`Erro: A soma dos componentes (${totalComponentsWeight.toFixed(3)} kg) excede o peso inicial recebido (${initialWeight.toFixed(3)} kg). Por favor, corrija antes de salvar!`);
      return;
    }

    // Check if components have materials selected
    const invalidComp = componentsWithPct.find(c => !c.materialId || c.peso <= 0);
    if (invalidComp) {
      alert('Certifique-se de que todos os componentes têm um material selecionado e peso válido.');
      return;
    }

    const payload = {
      numeroAmostra: sampleNumber,
      fornecedorId: selectedSupplierId,
      pesoInicial: initialWeight,
      observacoes: sampleObs,
      fotoUrl: samplePhoto || undefined,
      grauDificuldade,
      tempoRealizacao,
      componentes: componentsWithPct.map(c => ({
        materialId: c.materialId,
        peso: c.peso,
        percentual: parseFloat(c.percentual.toFixed(2)),
        observacoes: c.observacoes,
        fotoUrl: c.fotoUrl || undefined
      }))
    };

    const created = await api.createAmostra(payload as any);
    if (created) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      alert('Análise laboratorial salva com sucesso!');
      
      // Reset form
      setSampleObs('');
      setInitialWeight(0);
      setSamplePhoto(null);
      setGrauDificuldade('Médio');
      setTempoRealizacao('');
      setAnalysisComponents([{ materialId: '', peso: 0, observacoes: '', fotoUrl: null }]);
      
      loadAllData();
      setActiveTab('historico');
    }
  };

  // Approve / Finalize Analysis status
  const handleUpdateStatus = async (id: string, status: StatusAmostra, obs?: string) => {
    const updated = await api.updateAmostraStatus(id, status, obs);
    if (updated) {
      loadAllData();
      if (selectedSample && selectedSample.id === id) {
        setSelectedSample({ ...selectedSample, status, observacaoAdmin: obs || selectedSample.observacaoAdmin });
      }
      confetti({ particleCount: 80, spread: 50 });
      alert(`Status da análise atualizado para: ${status}`);
    }
  };

  // ---------------------------------------------------------
  // EXPORTS: PDF & EXCEL
  // ---------------------------------------------------------
  
  // Custom High-End PDF Report
  const generatePDFReport = (sample: Amostra) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor = '#052214'; // ApexTech Deep Green
    const accentColor = '#10b981'; // ApexTech Emerald Green
    const lightGray = '#f0fdf4'; // Light green background tint

    // Header Frame
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 210, 35, 'F');

    // Draw stylized logo monogram in PDF (based on the logo image)
    doc.setFillColor(accentColor);
    doc.triangle(20, 28, 30, 28, 25, 10, 'F');
    doc.setFillColor(primaryColor);
    doc.triangle(22, 26, 28, 26, 25, 14, 'F');
    doc.setFillColor(accentColor);
    doc.rect(15, 22, 20, 2.5, 'F');

    // Title text
    doc.setTextColor('#FFFFFF');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('APEXTECH METAIS', 42, 18);
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text('Sustentabilidade & Indústria 4.0 | Laboratório Metalúrgico de Reciclagem', 42, 25);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`LAUDO TÉCNICO: ${sample.numeroAmostra}`, 145, 18);
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Status: ${sample.status}`, 145, 25);

    // --- DRAW WATERMARK LOGO MONOGRAM & SECURITY TEXT ---
    const watermarkColor = '#e8faf1'; // Very light faint green
    doc.setFillColor(watermarkColor);
    doc.triangle(105, 190, 155, 190, 130, 110, 'F'); // Main A outline
    doc.setFillColor('#ffffff'); 
    doc.triangle(115, 180, 145, 180, 130, 128, 'F'); // Punch hole
    doc.setFillColor(watermarkColor);
    doc.rect(80, 160, 95, 8, 'F'); // Crossbar slash
    
    doc.setTextColor('#a2e3c3');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('DOCUMENTO OFICIAL APEXTECH METAIS - RASTREÁVEL', 105, 204, { align: 'center' });
    doc.text('PROPRIEDADE EXCLUSIVA - CÓPIA E USO NÃO AUTORIZADOS', 105, 211, { align: 'center' });

    // Customer & Info Section (Increased height to support technical triage fields)
    doc.setFillColor(lightGray);
    doc.rect(10, 42, 190, 48, 'F');
    
    doc.setTextColor('#333333');
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'bold');
    doc.text('DADOS DA AMOSTRA', 15, 48);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Fornecedor: ${sample.fornecedor?.razaoSocial || 'N/A'}`, 15, 56);
    doc.text(`Responsável Técnico: ${sample.responsavel?.nome || 'N/A'}`, 15, 62);
    doc.text(`Data de Recebimento: ${new Date(sample.data).toLocaleDateString('pt-BR')}`, 15, 68);
    doc.text(`Peso Inicial Recebido: ${sample.pesoInicial.toFixed(3)} kg`, 15, 74);
    doc.setFont('Helvetica', 'bold');
    doc.text(`Grau de Dificuldade: ${sample.grauDificuldade || 'Médio'}`, 15, 82);

    doc.setFont('Helvetica', 'normal');
    doc.text(`CNPJ Fornecedor: ${sample.fornecedor?.cnpj || 'N/A'}`, 110, 56);
    doc.text(`Perfil Resp: ${sample.responsavel?.perfil || 'N/A'}`, 110, 62);
    doc.text(`Método: Gravimetria Mecânica`, 110, 68);
    doc.text(`Realização do Desmonte: Manual`, 110, 74);
    doc.setFont('Helvetica', 'bold');
    doc.text(`Tempo de Realização: ${sample.tempoRealizacao || 'Não informado'}`, 110, 82);
    
    // Components details table
    doc.setFont('Helvetica', 'bold');
    doc.text('COMPOSIÇÃO QUÍMICA DA AMOSTRA (GRAVIMÉTRICO)', 15, 98);
    
    let y = 104;
    // Table Header
    doc.setFillColor(accentColor);
    doc.rect(10, y, 190, 8, 'F');
    doc.setTextColor('#FFFFFF');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Material / Componente', 15, y + 5);
    doc.text('Peso Encontrado (kg)', 85, y + 5);
    doc.text('Composição (%)', 135, y + 5);
    doc.text('Categoria', 170, y + 5);

    doc.setTextColor('#333333');
    doc.setFont('Helvetica', 'normal');
    
    let sumWeight = 0;
    sample.componentes.forEach((c) => {
      y += 8;
      doc.setFillColor('#FFFFFF');
      doc.rect(10, y, 190, 8, 'F');
      doc.text(c.material?.nome || 'N/A', 15, y + 5);
      doc.text(c.peso.toFixed(3), 85, y + 5);
      doc.text(`${c.percentual.toFixed(2)}%`, 135, y + 5);
      doc.text(c.material?.categoria || 'Outros', 170, y + 5);
      sumWeight += c.peso;
    });

    // Add Loss Row
    const lossWeight = Math.max(0, sample.pesoInicial - sumWeight);
    const lossPct = sample.pesoInicial > 0 ? (lossWeight / sample.pesoInicial) * 100 : 0;

    y += 8;
    doc.setFillColor('#FFEEEE');
    doc.rect(10, y, 190, 8, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.text('Resíduo / Perda de Desmonte', 15, y + 5);
    doc.text(lossWeight.toFixed(3), 85, y + 5);
    doc.text(`${lossPct.toFixed(2)}%`, 135, y + 5);
    doc.text('Resíduos Industriais', 170, y + 5);

    // Divider Line
    y += 12;
    doc.setDrawColor('#CCCCCC');
    doc.line(10, y, 200, y);

    // Formula Text
    y += 8;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('FÓRMULA AUTOMÁTICA DE PROPRIEDADE:', 15, y);
    
    const formulaStr = sample.componentes
      .map(c => `${c.percentual.toFixed(0)}% ${c.material?.nome}`)
      .concat([`${lossPct.toFixed(0)}% Perda`])
      .join(' | ');

    y += 6;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(formulaStr, 15, y);

    // Render Conditional Approval Observation if present
    if ((sample.status === 'APROVADO_CONDICIONAL' || sample.observacaoAdmin) && sample.observacaoAdmin) {
      y += 12;
      doc.setFillColor('#FFFBEB');
      doc.rect(10, y, 190, 16, 'F');
      doc.setDrawColor('#D97706');
      doc.rect(10, y, 190, 16);
      doc.setTextColor('#92400E');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('OBSERVAÇÃO DA APROVAÇÃO CONDICIONAL (ADMINISTRADOR):', 13, y + 5);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(sample.observacaoAdmin, 13, y + 11);
      y += 16;
    }

    // Render Component Photos inside PDF
    const photos = sample.componentes.filter(c => c.fotoUrl);
    if (sample.fotoUrl) {
      photos.unshift({ material: { nome: 'Lote Recebido (Foto Geral)' }, fotoUrl: sample.fotoUrl } as any);
    }
    if (photos.length > 0) {
      y += 12;
      doc.setTextColor('#333333');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('REGISTRO FOTOGRÁFICO DOS MATERIAIS ENCONTRADOS:', 15, y);
      
      y += 4;
      let xOffset = 10;
      photos.forEach((photo) => {
        if (xOffset + 40 > 200) {
          xOffset = 10;
          y += 35;
        }
        try {
          if (photo.fotoUrl) {
            doc.addImage(photo.fotoUrl, 'JPEG', xOffset, y, 35, 25);
            doc.setFontSize(7);
            doc.setFont('Helvetica', 'normal');
            doc.text(photo.material?.nome || 'Material', xOffset, y + 28);
            xOffset += 45;
          }
        } catch (err) {
          console.error('Error rendering image in PDF', err);
        }
      });
      y += 32;
    }

    // Digital Signature & QR
    y += 10;
    doc.setFillColor(lightGray);
    doc.rect(10, y, 190, 35, 'F');

    // QR Mock representation
    doc.setDrawColor(primaryColor);
    doc.rect(15, y + 5, 25, 25);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryColor);
    doc.text('CONFERÊNCIA', 18, y + 15);
    doc.text('QR CODE', 21, y + 20);

    // Signature Area
    doc.text('ASSINATURA DIGITAL DO RESPONSÁVEL', 80, y + 8);
    doc.line(80, y + 22, 190, y + 22);
    doc.setFont('Helvetica', 'normal');
    doc.text(`${sample.responsavel?.nome} - Químico Responsável`, 80, y + 26);
    doc.text('CRQ IV Região | ApexTech Metais Lab Cert', 80, y + 30);

    doc.save(`Laudo_ApexTech_${sample.numeroAmostra}.pdf`);
  };

  // Export Excel Spreadsheet
  const exportToExcel = (sample: Amostra) => {
    const sumWeight = sample.componentes.reduce((acc, c) => acc + c.peso, 0);
    const lossWeight = Math.max(0, sample.pesoInicial - sumWeight);
    const lossPct = sample.pesoInicial > 0 ? (lossWeight / sample.pesoInicial) * 100 : 0;

    const data = [
      { Informação: 'Número do Laudo', Valor: sample.numeroAmostra },
      { Informação: 'Fornecedor', Valor: sample.fornecedor?.razaoSocial },
      { Informação: 'CNPJ Fornecedor', Valor: sample.fornecedor?.cnpj },
      { Informação: 'Responsável Técnico', Valor: sample.responsavel?.nome },
      { Informação: 'Data Análise', Valor: new Date(sample.data).toLocaleDateString('pt-BR') },
      { Informação: 'Peso Inicial Recebido (kg)', Valor: sample.pesoInicial },
      { Informação: '', Valor: '' },
      { Informação: 'MATERIAL / COMPONENTE', Valor: 'PESO ENCONTRADO (kg)', Porcentagem: 'COMPOSIÇÃO (%)' },
      ...sample.componentes.map(c => ({
        Informação: c.material?.nome || 'N/A',
        Valor: c.peso,
        Porcentagem: `${c.percentual.toFixed(2)}%`
      })),
      { Informação: 'Resíduo / Perda de Desmonte', Valor: lossWeight, Porcentagem: `${lossPct.toFixed(2)}%` }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laudo Técnico');
    XLSX.writeFile(workbook, `Laudo_ApexTech_${sample.numeroAmostra}.xlsx`);
  };

  // ---------------------------------------------------------
  // METRICS & FILTERS FOR SEARCH
  // ---------------------------------------------------------
  const filteredSamples = samples.filter(s => {
    const text = globalSearch.toLowerCase();
    if (!text) return true;
    return (
      s.numeroAmostra.toLowerCase().includes(text) ||
      (s.fornecedor?.nomeFantasia || '').toLowerCase().includes(text) ||
      (s.responsavel?.nome || '').toLowerCase().includes(text) ||
      (s.status || '').toLowerCase().includes(text)
    );
  });

  // Calculate Dashboard KPI numbers
  const totalSamples = samples.length;
  const samplesInAnalysis = samples.filter(s => s.status === 'EM_ANALISE').length;
  const samplesApproved = samples.filter(s => s.status === 'APROVADO').length;
  // Peso Total analisado
  const totalAnalyzedWeight = samples.reduce((acc, s) => acc + s.pesoInicial, 0);

  // Perda Média %
  let sumLossPct = 0;
  samples.forEach(s => {
    const sumC = s.componentes.reduce((sum, c) => sum + c.peso, 0);
    const loss = Math.max(0, s.pesoInicial - sumC);
    sumLossPct += s.pesoInicial > 0 ? (loss / s.pesoInicial) * 100 : 0;
  });
  const avgLossPercentage = samples.length > 0 ? sumLossPct / samples.length : 0;

  // Chart Data preparation
  const chartMonthlyData = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Peso Analisado (kg)',
        data: [120, 230, 180, 290, 310, 420, totalAnalyzedWeight > 0 ? totalAnalyzedWeight : 400],
        backgroundColor: '#10b981',
        borderColor: '#00ff87',
        borderWidth: 1,
      },
    ],
  };

  // Stock Chart Data
  const stockChartData = {
    labels: stock.map(s => s.material?.nome || ''),
    datasets: [
      {
        label: 'Estoque Acumulado (kg)',
        data: stock.map(s => s.quantidade),
        backgroundColor: stock.map(s => s.material?.corHex || '#3E7CB1'),
        borderWidth: 1,
      }
    ]
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-200">
      {/* SIDEBAR */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser} 
        onSwitchRole={handleSwitchRole} 
        theme={theme}
        toggleTheme={toggleTheme}
        permissoes={permissoes}
      />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          currentUser={currentUser}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
        />

        {/* PAGE CONTENT */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Top welcome */}
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Portal Analítico LME</h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Visão geral do controle de qualidade e estoques ApexTech Metais.</p>
                </div>
                <div className="text-xs text-slate-500 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  Ref: <span className="font-semibold">{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Total de Amostras</span>
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 block">{totalSamples}</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-brand-light/10 text-brand-light flex items-center justify-center">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Em Análise</span>
                    <span className="text-3xl font-extrabold text-amber-500 mt-1 block">{samplesInAnalysis}</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center animate-pulse">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Amostras Aprovadas</span>
                    <span className="text-3xl font-extrabold text-emerald-500 mt-1 block">{samplesApproved}</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Perda Média %</span>
                    <span className="text-3xl font-extrabold text-rose-500 mt-1 block">{avgLossPercentage.toFixed(2)}%</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <Trash2 className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Charts grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Volume Monthly Chart */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Volume Analisado Mensal (kg)</h3>
                  <div className="h-64">
                    <BarChartReact data={chartMonthlyData} options={{ responsive: true, maintainAspectRatio: false }} />
                  </div>
                </div>

                {/* Stock distribution simple pie */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Estoque Atual por Material</h3>
                  <div className="h-64 relative flex items-center justify-center">
                    {stock.length > 0 ? (
                      <PieChartReact 
                        data={stockChartData} 
                        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} 
                      />
                    ) : (
                      <span className="text-xs text-slate-400">Nenhum estoque cadastrado</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent analysis queue */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="font-semibold text-sm">Fila Recente de Análises</h3>
                  <button 
                    onClick={() => setActiveTab('historico')}
                    className="text-xs text-brand-medium dark:text-brand-light font-medium hover:underline"
                  >
                    Ver todas as análises
                  </button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {samples.slice(0, 4).map((s) => (
                    <div key={s.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-950/20 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-lg bg-brand-dark/10 dark:bg-brand-medium/20 text-brand-medium dark:text-brand-light flex items-center justify-center font-bold">
                          {s.numeroAmostra.split('-').pop()}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{s.numeroAmostra}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">{s.fornecedor?.nomeFantasia || 'Fornecedor desconhecido'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-8">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Peso Inicial</span>
                          <span className="text-sm font-semibold text-slate-950 dark:text-slate-100">{s.pesoInicial.toFixed(3)} kg</span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Status</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mt-0.5 ${
                            s.status === 'APROVADO' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' :
                            s.status === 'FINALIZADO' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400' :
                            'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                          }`}>
                            {s.status}
                          </span>
                        </div>

                        <button 
                          onClick={() => {
                            setSelectedSample(s);
                            setActiveTab('historico');
                          }}
                          className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-brand-medium dark:text-brand-light hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors"
                        >
                          Ver Laudo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* NOVA ANALISE TAB */}
          {activeTab === 'analises' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Nova Análise Gravimétrica</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Cadastre uma nova amostra e detalhe seus componentes físicos para gerar a fórmula química.</p>
              </div>

              {/* Sample Details */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <h3 className="font-bold text-base border-b border-slate-100 dark:border-slate-800 pb-3">1. Informações Básicas da Amostra</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Número do Lote/Amostra</label>
                    <input 
                      type="text" 
                      value={sampleNumber} 
                      onChange={(e) => setSampleNumber(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-medium focus:outline-none dark:text-slate-200" 
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Fornecedor Origem</label>
                    <select
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-medium focus:outline-none dark:text-slate-200"
                    >
                      <option value="">Selecione o Fornecedor...</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.nomeFantasia} ({s.cnpj})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Peso Inicial Recebido (kg)</label>
                    <input 
                      type="number" 
                      step="0.001"
                      value={initialWeight || ''} 
                      onChange={(e) => setInitialWeight(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-medium focus:outline-none dark:text-slate-200 font-semibold"
                      placeholder="Ex: 10.500" 
                    />
                  </div>

                  {/* Drag and Drop Image representation */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Fotografia do Material Original</label>
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-3 text-center cursor-pointer hover:border-brand-medium transition-colors relative flex items-center justify-center h-[38px]">
                      {samplePhoto ? (
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-semibold text-emerald-500">Imagem carregada</span>
                          <button onClick={() => setSamplePhoto(null)} className="text-[10px] text-rose-500 underline ml-2">remover</button>
                        </div>
                      ) : (
                        <label className="cursor-pointer text-xs font-medium text-slate-400 hover:text-brand-medium">
                          Arraste ou escolha arquivo
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handlePhotoUpload(e, setSamplePhoto)}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Grau de Dificuldade do Processo</label>
                    <select
                      value={grauDificuldade}
                      onChange={(e) => setGrauDificuldade(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-medium focus:outline-none dark:text-slate-200"
                    >
                      <option value="Baixo">Baixo</option>
                      <option value="Médio">Médio</option>
                      <option value="Alto">Alto</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Tempo de Realização (ex: 45 min)</label>
                    <input 
                      type="text" 
                      value={tempoRealizacao} 
                      onChange={(e) => setTempoRealizacao(e.target.value)}
                      placeholder="Ex: 1h 30m"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-medium focus:outline-none dark:text-slate-200" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Observações Operacionais</label>
                  <textarea 
                    value={sampleObs}
                    onChange={(e) => setSampleObs(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-medium focus:outline-none dark:text-slate-200"
                    placeholder="Ex: Amostra recebida com presença excessiva de umidade no lote plástico."
                  ></textarea>
                </div>
              </div>

              {/* Analysis Components list */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-base">2. Componentes Separados no Desmonte</h3>
                  <button
                    type="button"
                    onClick={handleAddAnalysisComponent}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-brand-medium hover:bg-brand-light text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Componente</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {analysisComponents.map((item, index) => {
                    const weight = parseFloat(item.peso as any) || 0;
                    const pct = initialWeight > 0 ? (weight / initialWeight) * 100 : 0;
                    return (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-900/60 relative">
                        <div className="md:col-span-4">
                          <label className="text-[10px] font-semibold text-slate-400 block mb-1 uppercase">Material</label>
                          <select
                            value={item.materialId}
                            onChange={(e) => handleUpdateAnalysisComponent(index, 'materialId', e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-medium dark:text-slate-200"
                          >
                            <option value="">Selecione...</option>
                            {materials.map(m => (
                              <option key={m.id} value={m.id}>{m.nome} ({m.categoria})</option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-3">
                          <label className="text-[10px] font-semibold text-slate-400 block mb-1 uppercase">Peso (kg)</label>
                          <input 
                            type="number"
                            step="0.001"
                            value={item.peso || ''}
                            onChange={(e) => handleUpdateAnalysisComponent(index, 'peso', parseFloat(e.target.value) || 0)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-medium dark:text-slate-200 font-semibold"
                            placeholder="Ex: 1.250"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-[10px] font-semibold text-slate-400 block mb-1 uppercase">Percentual</label>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
                            {pct.toFixed(1)}%
                          </div>
                        </div>

                        {/* File Upload Representation for this component */}
                        <div className="md:col-span-2">
                          <div className="h-[34px] border border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center cursor-pointer hover:border-brand-medium transition-colors">
                            {item.fotoUrl ? (
                              <span className="text-[10px] text-emerald-500 font-semibold flex items-center">
                                <Check className="w-3 h-3 mr-1" /> Imagem OK
                              </span>
                            ) : (
                              <label className="cursor-pointer text-[10px] font-medium text-slate-400">
                                Upload Foto
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={(e) => handlePhotoUpload(e, (base64) => handleUpdateAnalysisComponent(index, 'fotoUrl', base64))}
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        <div className="md:col-span-1 text-right">
                          <button 
                            type="button"
                            onClick={() => handleRemoveAnalysisComponent(index)}
                            disabled={analysisComponents.length <= 1}
                            className="p-1.5 text-slate-400 hover:text-rose-500 disabled:opacity-30 transition-colors"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Auto Calculated Summary Section */}
                {(() => {
                  const calcs = getAnalysisCalculations();
                  return (
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-900 text-white rounded-xl">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Soma Componentes</span>
                          <span className="text-base font-extrabold text-white">{calcs.totalComponentsWeight.toFixed(3)} kg</span>
                        </div>
                        
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Peso Inicial</span>
                          <span className="text-base font-extrabold text-slate-300">{initialWeight.toFixed(3)} kg</span>
                        </div>

                        <div>
                          <span className="text-[10px] text-rose-400 block font-semibold uppercase">Perda Operacional</span>
                          <span className="text-base font-extrabold text-rose-400">{calcs.lostWeight.toFixed(3)} kg</span>
                        </div>

                        <div>
                          <span className="text-[10px] text-rose-400 block font-semibold uppercase">Perda (%)</span>
                          <span className="text-base font-extrabold text-rose-400">{calcs.lossPercentage.toFixed(2)}%</span>
                        </div>
                      </div>

                      {/* Formula display */}
                      <div className="mt-4 p-3 bg-brand-dark/15 dark:bg-brand-medium/10 border border-brand-medium/20 rounded-lg">
                        <span className="text-[10px] font-bold text-brand-medium dark:text-brand-light block uppercase tracking-wider">Composição Gravimétrica Resultante:</span>
                        <div className="mt-1.5 flex flex-wrap gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {calcs.componentsWithPct.map((c, i) => {
                            const mat = materials.find(m => m.id === c.materialId);
                            return (
                              <span key={i} className="bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded">
                                {c.percentual.toFixed(1)}% {mat ? mat.nome : 'Material'}
                              </span>
                            );
                          })}
                          <span className="bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 px-2.5 py-1 rounded">
                            {calcs.lossPercentage.toFixed(1)}% Perda
                          </span>
                        </div>
                      </div>

                      {/* STRICT WEIGHT VALIDATION ALERT */}
                      {calcs.totalComponentsWeight > initialWeight && (
                        <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-xl text-xs font-semibold flex items-center space-x-2">
                          <span>⚠️ Atenção: A soma dos pesos dos componentes ({calcs.totalComponentsWeight.toFixed(3)} kg) excede o peso inicial recebido ({initialWeight.toFixed(3)} kg). Ajuste as pesagens para poder salvar.</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Submit Action */}
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    disabled={getAnalysisCalculations().totalComponentsWeight > initialWeight}
                    onClick={handleSubmitAnalysis}
                    className={`px-6 py-2.5 font-semibold rounded-lg text-sm transition-colors ${
                      getAnalysisCalculations().totalComponentsWeight > initialWeight
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25'
                    }`}
                  >
                    Salvar e Gerar Laudo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* HISTORICO TAB */}
          {activeTab === 'historico' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Histórico de Análises</h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Busque laudos técnicos, aprove fórmulas para integrar ao estoque e exporte relatórios.</p>
                </div>
              </div>

              {/* Main structure: split screen if a sample is selected */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left side list */}
                <div className={`space-y-4 ${selectedSample ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
                  {filteredSamples.map((s) => (
                    <div 
                      key={s.id}
                      onClick={() => setSelectedSample(s)}
                      className={`p-5 bg-white dark:bg-slate-900 rounded-2xl border transition-all cursor-pointer ${
                        selectedSample?.id === s.id 
                          ? 'border-brand-medium shadow-md shadow-brand-medium/5 ring-1 ring-brand-medium' 
                          : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-bold text-brand-medium dark:text-brand-light block">{s.numeroAmostra}</span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{s.fornecedor?.nomeFantasia}</h4>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">Resp: {s.responsavel?.nome}</span>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          s.status === 'APROVADO' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' :
                          s.status === 'FINALIZADO' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                        }`}>
                          {s.status}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800/80 pt-3">
                        <span className="text-slate-400">{new Date(s.data).toLocaleDateString('pt-BR')}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{s.pesoInicial.toFixed(3)} kg</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right side detailed report (Laudo Industrial) */}
                {selectedSample && (
                  <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 relative overflow-hidden">
                    
                    {/* Header bar actions */}
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Visualização do Laudo</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => generatePDFReport(selectedSample)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                          title="Exportar PDF"
                        >
                          <FileDown className="w-4 h-4" />
                          <span>PDF</span>
                        </button>
                        <button
                          onClick={() => exportToExcel(selectedSample)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                          title="Exportar Excel"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Excel</span>
                        </button>
                        <button
                          onClick={() => setSelectedSample(null)}
                          className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2"
                        >
                          Fechar
                        </button>
                      </div>
                    </div>

                    {/* PDF Document Simulation Frame */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-slate-50 dark:bg-slate-950/40 space-y-6 relative overflow-hidden">
                      
                      {/* Watermark Logo & Text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-[0.03] dark:opacity-[0.02] select-none">
                        <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-80 h-80 mb-4">
                          <path d="M70 10 L10 185 M100 10 L200 185 M75 130 L220 70 M100 30 L150 120 L85 120 Z" stroke="#10B981" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-xl font-bold tracking-wider text-center text-slate-800 dark:text-white uppercase max-w-lg leading-normal">
                          DOCUMENTO OFICIAL APEXTECH METAIS - CÓPIA E USO NÃO AUTORIZADOS
                        </span>
                      </div>

                      {/* Logo and QR header */}
                      <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-6 flex-shrink-0">
                              <path d="M70 10 L10 185 M100 10 L200 185 M75 130 L220 70 M100 30 L150 120 L85 120 Z" stroke="#10B981" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="font-extrabold text-sm tracking-wider text-slate-900 dark:text-white">APEXTECH METAIS</span>
                          </div>
                          <span className="text-[9px] tracking-wider text-slate-400 block mt-0.5">LAUDOS DE ANÁLISE INDUSTRIAL</span>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-xs font-bold block text-slate-800 dark:text-slate-200">LAUDO: {selectedSample.numeroAmostra}</span>
                          <span className="text-[10px] text-slate-400">Data: {new Date(selectedSample.data).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>

                      {/* Header details */}
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Fornecedor</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5">{selectedSample.fornecedor?.razaoSocial}</span>
                          <span className="text-[10px] text-slate-500">CNPJ: {selectedSample.fornecedor?.cnpj}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Técnico Responsável</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5">{selectedSample.responsavel?.nome}</span>
                          <span className="text-[10px] text-slate-500">Reg CRQ: 0443-A/SP</span>
                        </div>
                      </div>

                      {/* Technician Triage Fields */}
                      <div className="grid grid-cols-2 gap-4 text-xs border-t border-slate-200 dark:border-slate-800 pt-3">
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Grau de Dificuldade</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5">{selectedSample.grauDificuldade || 'Médio'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Tempo de Realização</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5">{selectedSample.tempoRealizacao || 'Não informado'}</span>
                        </div>
                      </div>

                      {/* Data table */}
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60">
                            <th className="py-2 px-3 font-semibold text-slate-500">Material</th>
                            <th className="py-2 px-3 font-semibold text-slate-500 text-right">Peso (kg)</th>
                            <th className="py-2 px-3 font-semibold text-slate-500 text-right">Composição</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSample.componentes.map((c, i) => (
                            <tr key={i} className="border-b border-slate-100 dark:border-slate-900">
                              <td className="py-2 px-3 font-medium">{c.material?.nome}</td>
                              <td className="py-2 px-3 text-right font-semibold">{c.peso.toFixed(3)}</td>
                              <td className="py-2 px-3 text-right font-semibold text-brand-medium dark:text-brand-light">{c.percentual.toFixed(2)}%</td>
                            </tr>
                          ))}
                          {/* Loss row */}
                          {(() => {
                            const sumC = selectedSample.componentes.reduce((acc, c) => acc + c.peso, 0);
                            const loss = Math.max(0, selectedSample.pesoInicial - sumC);
                            const lossPct = selectedSample.pesoInicial > 0 ? (loss / selectedSample.pesoInicial) * 100 : 0;
                            return (
                              <tr className="bg-rose-500/5 text-rose-500">
                                <td className="py-2 px-3 font-bold">Perda Operacional (Desmonte)</td>
                                <td className="py-2 px-3 text-right font-bold">{loss.toFixed(3)}</td>
                                <td className="py-2 px-3 text-right font-bold">{lossPct.toFixed(2)}%</td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>

                      {/* Chemical Formula saved */}
                      <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                        <span className="font-bold text-[10px] text-slate-400 block uppercase tracking-wider">Fórmula Gravimétrica Registrada:</span>
                        <span className="font-semibold block mt-1">
                          {selectedSample.componentes.map(c => `${c.percentual.toFixed(0)}% ${c.material?.nome}`).concat(['Perdas']).join(' / ')}
                        </span>
                      </div>

                      {/* Admin conditional observations */}
                      {selectedSample.observacaoAdmin && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-lg text-xs">
                          <span className="font-bold text-[10px] text-amber-500 block uppercase tracking-wider">Aprovação Condicional - Feedback do Admin:</span>
                          <span className="font-semibold block mt-1">{selectedSample.observacaoAdmin}</span>
                        </div>
                      )}

                      {/* Photo Gallery inside Laudo */}
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-2">Registro Fotográfico Lab:</span>
                        <div className="flex space-x-3 overflow-x-auto pb-2">
                          {selectedSample.fotoUrl && (
                            <div className="flex-shrink-0 w-24 h-20 border border-slate-200 dark:border-slate-800 rounded overflow-hidden relative group">
                              <img src={selectedSample.fotoUrl} alt="Amostra" className="w-full h-full object-cover" />
                              <span className="absolute bottom-0 left-0 right-0 bg-slate-900/60 text-white text-[8px] text-center py-0.5">Geral</span>
                            </div>
                          )}
                          {selectedSample.componentes.map((c, i) => c.fotoUrl && (
                            <div key={i} className="flex-shrink-0 w-24 h-20 border border-slate-200 dark:border-slate-800 rounded overflow-hidden relative">
                              <img src={c.fotoUrl} alt="Comp" className="w-full h-full object-cover" />
                              <span className="absolute bottom-0 left-0 right-0 bg-slate-900/60 text-white text-[8px] text-center py-0.5">{c.material?.nome}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Digital signature and QR mock */}
                      <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800 pt-4">
                        <div className="flex items-center space-x-2">
                          <QrCode className="w-8 h-8 text-slate-400" />
                          <span className="text-[8px] text-slate-400 max-w-[120px] leading-tight">Consulta de Autenticidade pelo Portal de Rastreabilidade</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 block">Assinado Digitalmente por:</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{selectedSample.responsavel?.nome}</span>
                          <span className="text-[8px] text-slate-400">CRQ IV - APEXTECH LABS</span>
                        </div>
                      </div>
                    </div>

                    {/* Stock Integration and operations controls - Restricted only to ADMIN */}
                    {selectedSample.status !== 'APROVADO' && selectedSample.status !== 'APROVADO_CONDICIONAL' && currentUser.perfil === 'ADMIN' && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-emerald-500 block">Painel de Decisão (Apenas Admin)</span>
                            <span className="text-[10px] text-slate-400 max-w-sm block leading-normal mt-0.5">Decida se a fórmula química está liberada para estoque ou se necessita observação condicional.</span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleUpdateStatus(selectedSample.id, 'APROVADO')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
                            >
                              Aprovar Total
                            </button>
                            <button
                              onClick={() => {
                                setShowObservationInput(!showObservationInput);
                                setObservacaoAdmin('');
                              }}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-colors"
                            >
                              Aprovar Condicional
                            </button>
                          </div>
                        </div>

                        {showObservationInput && (
                          <div className="border-t border-emerald-500/20 pt-3 space-y-2">
                            <label className="text-[10px] font-semibold text-slate-400 block uppercase">Insira a observação/retorno para o Técnico:</label>
                            <textarea
                              value={observacaoAdmin}
                              onChange={(e) => setObservacaoAdmin(e.target.value)}
                              placeholder="Ex: Aprovo o lote com a condição de que o técnico reavalie os teores de resíduos plásticos no próximo desmonte."
                              rows={2}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-medium"
                            />
                            <div className="flex justify-end">
                              <button
                                onClick={() => {
                                  if (!observacaoAdmin.trim()) {
                                    alert('Por favor, insira uma observação para a aprovação condicional.');
                                    return;
                                  }
                                  handleUpdateStatus(selectedSample.id, 'APROVADO_CONDICIONAL', observacaoAdmin);
                                  setShowObservationInput(false);
                                  setObservacaoAdmin('');
                                }}
                                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded transition-colors"
                              >
                                Confirmar Condicional
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FORNECEDORES TAB */}
          {activeTab === 'fornecedores' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Gestão de Fornecedores</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Cadastre e gerencie a carteira de parceiros comerciais de entrega de recicláveis.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Creation Form */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="font-bold text-base border-b border-slate-100 dark:border-slate-800 pb-2">Novo Fornecedor</h3>
                  <form onSubmit={handleCreateSupplier} className="space-y-3">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Razão Social</label>
                      <input 
                        type="text" 
                        value={newSupplier.razaoSocial}
                        onChange={(e) => setNewSupplier({ ...newSupplier, razaoSocial: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200" 
                        placeholder="Razão Social"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Nome Fantasia</label>
                      <input 
                        type="text" 
                        value={newSupplier.nomeFantasia}
                        onChange={(e) => setNewSupplier({ ...newSupplier, nomeFantasia: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200" 
                        placeholder="Nome Fantasia"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">CNPJ</label>
                      <input 
                        type="text" 
                        value={newSupplier.cnpj}
                        onChange={(e) => setNewSupplier({ ...newSupplier, cnpj: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200" 
                        placeholder="00.000.000/0001-00"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Contato Responsável</label>
                      <input 
                        type="text" 
                        value={newSupplier.contato}
                        onChange={(e) => setNewSupplier({ ...newSupplier, contato: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200" 
                        placeholder="Nome contato"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Telefone</label>
                      <input 
                        type="text" 
                        value={newSupplier.telefone}
                        onChange={(e) => setNewSupplier({ ...newSupplier, telefone: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200" 
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">E-mail</label>
                      <input 
                        type="email" 
                        value={newSupplier.email}
                        onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200" 
                        placeholder="email@provedor.com"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Endereço Comercial</label>
                      <input 
                        type="text" 
                        value={newSupplier.endereco}
                        onChange={(e) => setNewSupplier({ ...newSupplier, endereco: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200" 
                        placeholder="Rua, Número, Cidade - UF"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-brand-medium hover:bg-brand-light text-white text-xs font-bold rounded transition-colors"
                    >
                      Cadastrar Fornecedor
                    </button>
                  </form>
                </div>

                {/* Suppliers List */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden lg:col-span-2">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-sm">Fornecedores Homologados</h3>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {suppliers.map((s) => (
                      <div key={s.id} className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-950/20 transition-colors">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{s.nomeFantasia}</h4>
                          <span className="text-xs text-slate-400">{s.razaoSocial} | {s.cnpj}</span>
                          <div className="flex space-x-4 mt-2 text-xs text-slate-400">
                            <span className="flex items-center"><User className="w-3.5 h-3.5 mr-1" /> {s.contato}</span>
                            <span className="flex items-center"><Phone className="w-3.5 h-3.5 mr-1" /> {s.telefone}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MATERIAIS TAB */}
          {activeTab === 'materiais' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Cadastro de Materiais</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure o catálogo de materiais de reciclagem, cores visuais e unidades para triagem de laudos.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create form */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="font-bold text-base border-b border-slate-100 dark:border-slate-800 pb-2">Novo Material</h3>
                  <form onSubmit={handleCreateMaterial} className="space-y-3">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Nome do Material</label>
                      <input 
                        type="text"
                        value={newMaterial.nome}
                        onChange={(e) => setNewMaterial({ ...newMaterial, nome: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200" 
                        placeholder="Ex: Cobre Vermelho"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Unidade</label>
                      <select
                        value={newMaterial.unidade}
                        onChange={(e) => setNewMaterial({ ...newMaterial, unidade: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200"
                      >
                        <option value="kg">Quilograma (kg)</option>
                        <option value="g">Grama (g)</option>
                        <option value="t">Tonelada (t)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Categoria</label>
                      <select
                        value={newMaterial.categoria}
                        onChange={(e) => setNewMaterial({ ...newMaterial, categoria: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200"
                      >
                        <option value="Metais Nobres">Metais Nobres</option>
                        <option value="Metais Comuns">Metais Comuns</option>
                        <option value="Metais Preciosos">Metais Preciosos</option>
                        <option value="Polímeros">Polímeros</option>
                        <option value="Ligas Metálicas">Ligas Metálicas</option>
                        <option value="Sucata Tecnológica">Sucata Tecnológica</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Cor Temática Hex</label>
                      <input 
                        type="color"
                        value={newMaterial.corHex}
                        onChange={(e) => setNewMaterial({ ...newMaterial, corHex: e.target.value })}
                        className="w-full h-8 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Observações</label>
                      <textarea
                        value={newMaterial.observacoes}
                        onChange={(e) => setNewMaterial({ ...newMaterial, observacoes: e.target.value })}
                        rows={2}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-brand-medium hover:bg-brand-light text-white text-xs font-bold rounded transition-colors"
                    >
                      Salvar Material
                    </button>
                  </form>
                </div>

                {/* List table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden lg:col-span-2">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                        <th className="p-4 font-semibold">Identificador</th>
                        <th className="p-4 font-semibold">Nome</th>
                        <th className="p-4 font-semibold">Categoria</th>
                        <th className="p-4 font-semibold text-center">Visual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.map((m) => (
                        <tr key={m.id} className="border-b border-slate-100 dark:border-slate-850">
                          <td className="p-4 font-bold text-slate-400">{m.id}</td>
                          <td className="p-4 font-semibold">{m.nome} ({m.unidade})</td>
                          <td className="p-4">{m.categoria}</td>
                          <td className="p-4 text-center">
                            <span 
                              className="inline-block w-4 h-4 rounded-full border border-white" 
                              style={{ backgroundColor: m.corHex }}
                            ></span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ESTOQUE INTELIGENTE TAB */}
          {activeTab === 'estoque' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Estoque Geral de Metais</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Saldo integrado automaticamente conforme laudos laboratoriais e fórmulas são validados.</p>
              </div>

              {/* Grid of Materials Stocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stock.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    {/* Visual color bar banner */}
                    <div 
                      className="absolute top-0 left-0 right-0 h-1.5" 
                      style={{ backgroundColor: item.material?.corHex }}
                    ></div>
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-slate-400 block uppercase">{item.material?.categoria}</span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{item.material?.nome}</h3>
                      </div>
                      <span className="text-xs text-slate-400">{item.material?.unidade}</span>
                    </div>

                    <div className="mt-6 flex justify-between items-baseline">
                      <span className="text-4xl font-black text-brand-light">{item.quantidade.toFixed(2)}</span>
                      <span className="text-xs text-slate-400 font-semibold uppercase">Saldo Disponível</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AUDITORIA TAB */}
          {activeTab === 'auditoria' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Registro de Auditoria (Logs)</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Rastreabilidade completa de todas as ações executadas no ERP Lab pelos colaboradores.</p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                      <th className="p-4 font-semibold text-slate-500">Data/Hora</th>
                      <th className="p-4 font-semibold text-slate-500">Usuário</th>
                      <th className="p-4 font-semibold text-slate-500">Perfil</th>
                      <th className="p-4 font-semibold text-slate-500">Ação</th>
                      <th className="p-4 font-semibold text-slate-500">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-100 dark:border-slate-850">
                        <td className="p-4 text-slate-400">{new Date(log.dataHora).toLocaleString('pt-BR')}</td>
                        <td className="p-4 font-semibold">{log.usuario?.nome}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[9px]">
                            {log.usuario?.perfil}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-brand-light">{log.acao}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{log.detalhes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* USER MANAGEMENT & PERMISSIONS TAB */}
          {activeTab === 'usuarios' && (currentUser.perfil === 'ADMIN' || currentUser.perfil === 'DIR') && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Controle de Acessos & Perfis</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure permissões de abas por perfil e cadastre/gerencie os colaboradores do sistema.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Add User Form */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="font-bold text-base border-b border-slate-100 dark:border-slate-800 pb-2">Novo Usuário</h3>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!newUserFields.nome || !newUserFields.email || !newUserFields.senha) {
                      alert('Preencha todos os campos obrigatórios.');
                      return;
                    }
                    const created = api.createUser({ ...newUserFields, ativo: true });
                    if (created) {
                      alert('Usuário cadastrado com sucesso!');
                      setNewUserFields({ nome: '', email: '', senha: '', perfil: 'LAB' });
                      loadAllData();
                    }
                  }} className="space-y-3">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Nome Completo</label>
                      <input 
                        type="text" 
                        value={newUserFields.nome}
                        onChange={(e) => setNewUserFields({ ...newUserFields, nome: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs dark:text-slate-200" 
                        placeholder="Nome"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">E-mail</label>
                      <input 
                        type="email" 
                        value={newUserFields.email}
                        onChange={(e) => setNewUserFields({ ...newUserFields, email: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs dark:text-slate-200" 
                        placeholder="email@apextech.com.br"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Senha Provisória</label>
                      <input 
                        type="password" 
                        value={newUserFields.senha}
                        onChange={(e) => setNewUserFields({ ...newUserFields, senha: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs dark:text-slate-200" 
                        placeholder="******"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Perfil de Acesso</label>
                      <select
                        value={newUserFields.perfil}
                        onChange={(e) => setNewUserFields({ ...newUserFields, perfil: e.target.value as Perfil })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs dark:text-slate-200"
                      >
                        <option value="ADMIN">Administrador</option>
                        <option value="LAB">Laboratório (Químico)</option>
                        <option value="COMPRAS">Compras / Comercial</option>
                        <option value="PROD">Produção / Pátio</option>
                        <option value="FIN">Financeiro</option>
                        <option value="DIR">Diretoria Executiva</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-brand-medium hover:bg-brand-light text-white text-xs font-bold rounded transition-colors"
                    >
                      Criar Colaborador
                    </button>
                  </form>
                </div>

                {/* 2. Colaboradores List */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden lg:col-span-2">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-sm">Colaboradores Cadastrados</h3>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[380px] overflow-y-auto">
                    {allUsers.map((u) => (
                      <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-950/20 transition-colors">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{u.nome}</h4>
                          <span className="text-xs text-slate-400">{u.email}</span>
                          <span className="ml-3 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[9px]">
                            {u.perfil}
                          </span>
                        </div>
                        <div>
                          <button
                            onClick={() => {
                              api.updateUser(u.id, { ativo: !u.ativo });
                              loadAllData();
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                              u.ativo 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400'
                            }`}
                          >
                            {u.ativo ? 'Ativo' : 'Inativo'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Profiles Permission Grid */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-sm">Matriz de Permissões de Acesso (flags/checkboxes)</h3>
                  <p className="text-slate-400 text-xs mt-1">Marque ou desmarque para controlar quais abas do menu de navegação lateral cada perfil pode visualizar e operar.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                        <th className="p-4 font-semibold text-slate-500">Perfil / Função</th>
                        <th className="p-4 font-semibold text-slate-500 text-center">Dashboard</th>
                        <th className="p-4 font-semibold text-slate-500 text-center">Nova Análise</th>
                        <th className="p-4 font-semibold text-slate-500 text-center">Histórico & Laudos</th>
                        <th className="p-4 font-semibold text-slate-500 text-center">Fornecedores</th>
                        <th className="p-4 font-semibold text-slate-500 text-center">Materiais</th>
                        <th className="p-4 font-semibold text-slate-500 text-center">Estoque Geral</th>
                        <th className="p-4 font-semibold text-slate-500 text-center">Logs Auditoria</th>
                        <th className="p-4 font-semibold text-slate-500 text-center">Gestão Usuários</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(permissoes).map((roleKey) => {
                        const role = roleKey as Perfil;
                        const rolePerms = permissoes[role];
                        const handleTogglePermission = (field: keyof PermissoesPerfil) => {
                          const updated = {
                            ...permissoes,
                            [role]: {
                              ...rolePerms,
                              [field]: !rolePerms[field]
                            }
                          };
                          setPermissoes(updated);
                          api.updatePermissoes(updated);
                        };

                        return (
                          <tr key={role} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-950/20">
                            <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{role}</td>
                            
                            <td className="p-4 text-center">
                              <input 
                                type="checkbox"
                                checked={rolePerms.dashboard}
                                onChange={() => handleTogglePermission('dashboard')}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                              />
                            </td>

                            <td className="p-4 text-center">
                              <input 
                                type="checkbox"
                                checked={rolePerms.analises}
                                onChange={() => handleTogglePermission('analises')}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                              />
                            </td>

                            <td className="p-4 text-center">
                              <input 
                                type="checkbox"
                                checked={rolePerms.historico}
                                onChange={() => handleTogglePermission('historico')}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                              />
                            </td>

                            <td className="p-4 text-center">
                              <input 
                                type="checkbox"
                                checked={rolePerms.fornecedores}
                                onChange={() => handleTogglePermission('fornecedores')}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                              />
                            </td>

                            <td className="p-4 text-center">
                              <input 
                                type="checkbox"
                                checked={rolePerms.materiais}
                                onChange={() => handleTogglePermission('materiais')}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                              />
                            </td>

                            <td className="p-4 text-center">
                              <input 
                                type="checkbox"
                                checked={rolePerms.estoque}
                                onChange={() => handleTogglePermission('estoque')}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                              />
                            </td>

                            <td className="p-4 text-center">
                              <input 
                                type="checkbox"
                                checked={rolePerms.auditoria}
                                onChange={() => handleTogglePermission('auditoria')}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                              />
                            </td>

                            <td className="p-4 text-center">
                              <input 
                                type="checkbox"
                                checked={rolePerms.usuarios}
                                onChange={() => handleTogglePermission('usuarios')}
                                disabled={role === 'ADMIN'}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded disabled:opacity-40"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
