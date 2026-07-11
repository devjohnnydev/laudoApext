import React, { useState } from 'react';
import { Bell, Search, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { Usuario } from '../types';

interface HeaderProps {
  currentUser: Usuario;
  globalSearch: string;
  setGlobalSearch: (val: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  globalSearch,
  setGlobalSearch
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Real-time notification simulations
  const notifications = [
    { id: 1, type: 'info', message: 'Nova amostra AM-2026-003 recebida do fornecedor E-Waste Solutions.', time: '5m atrás' },
    { id: 2, type: 'success', message: 'Fórmula da amostra AM-2026-001 foi aprovada e integrada ao estoque.', time: '2h atrás' },
    { id: 3, type: 'warning', message: 'Estoque do Cobre atingiu nível recomendado mínimo.', time: '1d atrás' }
  ];

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40 no-print">
      {/* Global Search Bar */}
      <div className="relative w-96">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Busca inteligente (código, fornecedor, responsável...)"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium dark:text-slate-200 transition-all"
        />
      </div>

      {/* Action Icons */}
      <div className="flex items-center space-x-4">
        {/* Notification Panel */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-brand-medium dark:text-slate-400 dark:hover:text-brand-light transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
                <span className="font-semibold text-sm">Notificações</span>
                <span className="text-xs text-brand-medium dark:text-brand-light font-medium cursor-pointer hover:underline">Marcar como lidas</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-950/20 flex space-x-3 transition-colors">
                    {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
                    {n.type === 'info' && <FileText className="w-4 h-4 text-brand-light flex-shrink-0 mt-0.5" />}
                    {n.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />}
                    <div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-slate-400 font-normal block mt-1">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Industrial Status Indicator */}
        <div className="flex items-center space-x-2 border-l border-slate-200 dark:border-slate-800 pl-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 mr-2 font-medium">Usuário: {currentUser.nome}</span>
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400">LAB_ONLINE</span>
        </div>
      </div>
    </header>
  );
};
