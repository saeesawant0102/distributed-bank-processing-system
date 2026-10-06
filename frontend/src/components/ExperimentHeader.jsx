import React from 'react';
import { HelpCircle, BookOpen } from 'lucide-react';

export function ExperimentHeader({ number, title, subtitle, concept, viva }) {
  const [showViva, setShowViva] = React.useState(false);

  return (
    <div className="dash-panel p-4 bg-[#0d1322] border-[#1e293b]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-blue-400 font-bold">
            <span>{number}</span>
            <span>/</span>
            <span className="uppercase tracking-wider text-slate-100">{title}</span>
          </div>
          <h2 className="text-sm font-bold text-slate-200 mt-0.5 font-sans">
            {subtitle}
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            {concept}
          </p>
        </div>

        {viva && (
          <button
            onClick={() => setShowViva(!showViva)}
            className="text-xs font-mono px-2.5 py-1 rounded bg-[#151e32] hover:bg-[#1f2c47] text-slate-300 border border-[#27354f] transition-all flex items-center gap-1.5 shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>{showViva ? 'Hide Viva Q&A' : 'Viva Prep'}</span>
          </button>
        )}
      </div>

      {showViva && viva && (
        <div className="mt-3 pt-3 border-t border-[#1e293b] space-y-2 font-mono text-xs">
          <div className="text-[10px] uppercase font-bold text-blue-400 tracking-wider flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" /> Viva Prep Questions & Answers
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {viva.map((item, idx) => (
              <div key={idx} className="p-2.5 rounded bg-[#090e1a] border border-slate-800 space-y-1">
                <div className="text-slate-200 font-bold">Q: {item.q}</div>
                <div className="text-slate-400 text-[11px] font-sans">A: {item.a}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
