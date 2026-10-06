import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

export function ResultBanner({ type = 'info', title, description, details }) {
  if (!title) return null;

  const isDanger = type === 'danger' || type === 'error' || type === 'race';
  const isSuccess = type === 'success';

  return (
    <div
      className={`p-3 rounded-lg border text-xs transition-all ${
        isDanger
          ? 'bg-red-950/20 border-red-800/50 text-red-300'
          : isSuccess
          ? 'bg-emerald-950/20 border-emerald-800/50 text-emerald-300'
          : 'bg-blue-950/20 border-blue-800/50 text-blue-300'
      }`}
      id="simulation-result-banner"
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 shrink-0">
          {isDanger && <AlertTriangle className="w-4 h-4 text-red-400" />}
          {isSuccess && <CheckCircle className="w-4 h-4 text-emerald-400" />}
          {!isDanger && !isSuccess && <Info className="w-4 h-4 text-blue-400" />}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-xs tracking-tight">{title}</h4>
          {description && <p className="text-[11px] mt-0.5 opacity-90 leading-relaxed">{description}</p>}
          {details && (
            <div className="mt-1.5 p-1.5 rounded bg-[#090d16] border border-slate-800 font-mono text-[11px]">
              {details}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
