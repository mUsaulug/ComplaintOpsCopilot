import React from 'react';
import { Icons } from '../constants';

const KVKKBadge: React.FC = () => {
    return (
        <div className="group relative">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-full cursor-help hover:bg-emerald-100 transition-colors">
                <div className="text-emerald-600">
                    <Icons.Shield />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight">KVKK Uyumlu</span>
            </div>

            {/* Tooltip */}
            <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <p className="font-bold mb-1">Veri Güvenliği Protokolü</p>
                <p className="text-slate-300 leading-relaxed">
                    Bu ekrandaki tüm hassas kişisel veriler (TCKN, İletişim vb.) kaynağından maskelenerek getirilmiştir. Ham veriler veritabanında saklanmamaktadır.
                </p>
                <div className="absolute -top-1.5 right-4 w-3 h-3 bg-slate-800 rotate-45" />
            </div>
        </div>
    );
};

export default KVKKBadge;
