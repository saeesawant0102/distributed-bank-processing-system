import React, { useState } from 'react';
import { BookOpen, HelpCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';

export function ExperimentDescription({
  title,
  concept,
  scenario,
  viva = [],
  realVsSimulated = 'Algorithms are implemented strictly as defined. Process/hardware boundaries are simulated in unified memory.',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showViva, setShowViva] = useState(false);

  return (
    <div className="dash-panel p-3 border-[#1e293b]" id="experiment-description">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wide">
            {title} — Concept & Theory Guide
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-sans">
            {isOpen ? 'Collapse' : 'Expand Details'}
          </span>
          <button className="text-slate-400 hover:text-slate-200">
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-[#1e293b] space-y-2.5 text-xs text-slate-300 leading-relaxed">
          <div>
            <span className="font-semibold text-blue-400 block mb-0.5 text-[11px] uppercase tracking-wider">
              Theoretical Foundation
            </span>
            <p className="text-slate-300">{concept}</p>
          </div>

          <div>
            <span className="font-semibold text-emerald-400 block mb-0.5 text-[11px] uppercase tracking-wider">
              Banking Scenario
            </span>
            <p className="text-slate-300">{scenario}</p>
          </div>

          <div className="p-2 rounded bg-[#0b101d] border border-[#1e293b] text-slate-400 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <div className="text-[11px]">
              <span className="text-slate-300 font-medium">Real vs Simulated: </span>
              {realVsSimulated}
            </div>
          </div>

          {viva.length > 0 && (
            <div className="pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowViva(!showViva);
                }}
                className="btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1.5"
              >
                <HelpCircle className="w-3 h-3 text-amber-400" />
                <span>{showViva ? 'Hide Viva Questions' : `View ${viva.length} Viva Questions & Answers`}</span>
              </button>

              {showViva && (
                <div className="mt-2 space-y-2 p-2.5 rounded bg-[#0b101d] border border-[#1e293b]">
                  {viva.map((item, idx) => (
                    <div key={idx} className="border-b border-slate-800/80 pb-1.5 last:border-b-0 last:pb-0">
                      <p className="font-semibold text-amber-300 text-[11px]">Q{idx + 1}: {item.q}</p>
                      <p className="text-slate-300 text-[11px] mt-0.5">{item.a}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
