import React from 'react';
import { LayoutDashboard, Users, ShieldAlert, Layers, PlusCircle, ClipboardList, Database, Moon, Sun, ShieldCheck } from 'lucide-react';
import { Perfil, Usuario, PermissoesPerfil } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: Usuario;
  onSwitchRole: (perfil: Perfil) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  permissoes: Record<Perfil, PermissoesPerfil>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onSwitchRole,
  theme,
  toggleTheme,
  permissoes
}) => {
  // Get permissions for current user's profile
  const userPerms = permissoes[currentUser.perfil] || {
    dashboard: true,
    analises: false,
    historico: true,
    fornecedores: false,
    materiais: false,
    estoque: false,
    auditoria: false,
    usuarios: false
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: userPerms.dashboard },
    { id: 'analises', label: 'Nova Análise', icon: PlusCircle, visible: userPerms.analises },
    { id: 'historico', label: 'Histórico & Laudos', icon: ClipboardList, visible: userPerms.historico },
    { id: 'fornecedores', label: 'Fornecedores', icon: Users, visible: userPerms.fornecedores },
    { id: 'materiais', label: 'Materiais', icon: Layers, visible: userPerms.materiais },
    { id: 'estoque', label: 'Estoque Inteligente', icon: Database, visible: userPerms.estoque },
    { id: 'auditoria', label: 'Logs de Auditoria', icon: ShieldAlert, visible: userPerms.auditoria },
    { id: 'usuarios', label: 'Acessos & Perfis', icon: ShieldCheck, visible: userPerms.usuarios || currentUser.perfil === 'ADMIN' },
  ];

  const visibleMenuItems = menuItems.filter(item => item.visible);

  const roleLabels: Record<Perfil, string> = {
    ADMIN: 'Administrador',
    LAB: 'Laboratório (Químico)',
    COMPRAS: 'Compras / Comercial',
    PROD: 'Produção / Pátio',
    FIN: 'Financeiro',
    DIR: 'Diretoria Executiva'
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col h-screen sticky top-0 no-print">
      {/* Brand Header with custom SVG Logo */}
      <div className="p-6 border-b border-slate-800 flex flex-col items-center justify-center">
        <div className="flex items-center space-x-2">
          {/* Logo Mark SVG */}
          <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-8 flex-shrink-0">
            <path d="M70 10 L10 185 M100 10 L200 185 M75 130 L220 70 M100 30 L150 120 L85 120 Z" stroke="#10B981" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-extrabold text-xl tracking-wider text-white">APEXTECH</span>
        </div>
        <span className="text-[10px] tracking-[0.25em] text-brand-light font-semibold mt-1">METAIS RECICLÁVEIS</span>
      </div>

      {/* User Session Info & Role Switcher */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800/80">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-light font-bold">
            {currentUser.nome.charAt(0)}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">{currentUser.nome}</h4>
            <span className="text-xs text-brand-light font-medium flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              {roleLabels[currentUser.perfil]}
            </span>
          </div>
        </div>

        {/* Quick Role Switcher for Demo evaluation */}
        <div className="mt-3">
          <label className="text-[10px] text-slate-400 block mb-1 font-semibold uppercase tracking-wider">Simular Perfil:</label>
          <select 
            value={currentUser.perfil}
            onChange={(e) => onSwitchRole(e.target.value as Perfil)}
            className="w-full text-xs bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-brand-light"
          >
            {Object.entries(roleLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-brand-medium text-white shadow-lg shadow-brand-medium/25 border-l-4 border-brand-light' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer controls */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span>v1.0.0 ERP Lab</span>
        <button
          onClick={toggleTheme}
          className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title={theme === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>
      </div>
    </aside>
  );
};
