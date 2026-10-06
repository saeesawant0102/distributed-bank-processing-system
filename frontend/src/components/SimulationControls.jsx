import React from 'react';
import { Play, Pause, StepForward, RotateCcw } from 'lucide-react';

export function SimulationControls({
  isPlaying,
  onPlay,
  onPause,
  onStep,
  onReset,
  speed,
  onSpeedChange,
  queueLength = 0,
}) {
  return (
    <div
      className="dash-panel p-2.5 px-3.5 flex flex-wrap items-center justify-between gap-3"
      id="simulation-controls"
    >
      {/* Simulation Playback Actions */}
      <div className="flex items-center gap-1.5">
        {isPlaying ? (
          <button
            id="pause-sim-btn"
            onClick={onPause}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-amber-300 hover:text-amber-200"
            title="Pause Event Playback"
          >
            <Pause className="w-3.5 h-3.5 text-amber-400" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            id="play-sim-btn"
            onClick={onPlay}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
            title="Resume Event Playback"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Resume</span>
          </button>
        )}

        <button
          id="step-sim-btn"
          onClick={onStep}
          disabled={queueLength === 0}
          className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1.5 disabled:opacity-40"
          title="Advance 1 Queued Event"
        >
          <StepForward className="w-3.5 h-3.5 text-slate-300" />
          <span>Step</span>
        </button>

        <button
          id="reset-sim-btn"
          onClick={onReset}
          className="btn-danger text-xs py-1.5 px-2.5 flex items-center gap-1.5 ml-1"
          title="Reset Cluster State"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Speed & Queue Telemetry */}
      <div className="flex items-center gap-4 text-xs font-mono">
        {/* Compact Segmented Control for Speed */}
        <div className="flex items-center gap-1.5 bg-[#0b101d] px-2 py-1 rounded border border-[#222f49]">
          <span className="text-[11px] text-slate-400 font-sans mr-0.5">Speed:</span>
          {[0.5, 1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              id={`speed-${s}x-btn`}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                speed === s
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Queued Events Indicator */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-slate-400 font-sans">Queue:</span>
          <span
            className={`px-2 py-0.5 rounded font-semibold ${
              queueLength > 0
                ? 'bg-blue-950/60 text-blue-300 border border-blue-800/40'
                : 'bg-slate-800/60 text-slate-400'
            }`}
          >
            {queueLength} events
          </span>
        </div>
      </div>
    </div>
  );
}
