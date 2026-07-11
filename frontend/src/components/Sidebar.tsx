import React from 'react';
import { LayoutDashboard, Users, ShieldAlert, Layers, PlusCircle, ClipboardList, Database, Moon, Sun, ShieldCheck, LogOut } from 'lucide-react';
import { Perfil, Usuario, PermissoesPerfil } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: Usuario;
  onSwitchRole: (perfil: Perfil) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  permissoes: Record<Perfil, PermissoesPerfil>;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onSwitchRole,
  theme,
  toggleTheme,
  permissoes,
  onLogout
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
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-8 flex-shrink-0">
            {/* Monogram A body */}
            <path d="M48 8 L12 90 H30 L48 45 L62 78 H80 L52 8 Z" fill="#10B981" />
            {/* Slash */}
            <path d="M18 64 L95 42 L62 52 Z" fill="#10B981" />
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
        <div className="flex space-x-1.5">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={theme === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 border border-rose-900/50 transition-colors"
              title="Sair do Sistema"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
