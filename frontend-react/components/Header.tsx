
import React from 'react';
import { Icons } from '../constants';

const Header: React.FC = () => {
  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-3">
        <div className="bg-slate-900 text-white p-1.5 rounded-lg">
          <Icons.Shield />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-slate-900">ComplaintOps Copilot</span>
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Fintech Core v2.4</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-500">
          <a href="#" className="text-slate-900 border-b-2 border-blue-600 px-1 py-4 h-14 flex items-center">Operasyon</a>
          <a href="#" className="hover:text-slate-900 px-1 py-4 h-14 flex items-center transition-colors">Arşiv</a>
          <a href="#" className="hover:text-slate-900 px-1 py-4 h-14 flex items-center transition-colors">Analitik</a>
        </nav>
        
        <div className="flex items-center gap-3 pl-6 border-l">
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-slate-900">Zeynep Y.</span>
            <span className="text-[10px] text-slate-500">Senior Specialist</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 font-bold text-xs">
            ZY
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
