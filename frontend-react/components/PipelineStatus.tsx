import React from 'react';
import { Icons } from '../constants';

type StageState = 'pending' | 'ok' | 'warning' | 'failed';

interface Stage {
  id: string;
  label: string;
  state: StageState;
  detail?: string;
}

interface Props {
  stages: Stage[];
}

const STATE_STYLES: Record<StageState, string> = {
  pending: 'bg-slate-100 text-slate-500 border-slate-200',
  ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
};

const PipelineStatus: React.FC<Props> = ({ stages }) => {
  return (
    <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icons.Shield />
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Güvenlik & Pipeline</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {stages.map((stage) => (
          <div key={stage.id} className={`p-3 rounded-xl border text-xs font-semibold ${STATE_STYLES[stage.state]}`}>
            <div className="flex items-center justify-between">
              <span>{stage.label}</span>
              <span className="text-[10px] uppercase">{stage.state}</span>
            </div>
            {stage.detail && (
              <p className="mt-1 text-[10px] font-medium opacity-80">{stage.detail}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PipelineStatus;
