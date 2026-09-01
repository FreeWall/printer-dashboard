import React from 'react';
import { useStreamStore } from '../store/useStreamStore';
import {
  Printer,
  Clock,
  Flame,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileCode,
  CheckCircle2,
  PauseCircle,
} from 'lucide-react';
import { PrinterState } from '../types';

function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null || isNaN(seconds) || seconds < 0) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export const PrinterStatusPanel: React.FC = () => {
  const {
    printerData,
    printerEnabled,
    isPrinterPanelCompact,
    togglePrinterCompact,
    setIsSettingsOpen,
  } = useStreamStore();

  if (!printerEnabled) return null;

  const state: PrinterState = printerData?.state || 'OFFLINE';
  const progress = printerData?.job?.progress;
  const isPrinting = state === 'PRINTING';
  const isPaused = state === 'PAUSED';
  const isStopped = state === 'STOPPED';
  const isIdle = state === 'IDLE' || state === 'READY';
  const isOffline = state === 'OFFLINE' || state === 'ERROR';

  const getStateBadge = () => {
    switch (state) {
      case 'PRINTING':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-400 text-[11px] font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shadow-[0_0_8px_#38bdf8]" />
            PRINTING
          </div>
        );
      case 'PAUSED':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[11px] font-bold tracking-wide">
            <PauseCircle size={12} />
            PAUSED
          </div>
        );
      case 'FINISHED':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold tracking-wide">
            <CheckCircle2 size={12} />
            FINISHED
          </div>
        );
      case 'BUSY':
      case 'ATTENTION':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-[11px] font-bold tracking-wide">
            <AlertCircle size={12} />
            {state}
          </div>
        );
      case 'READY':
      case 'IDLE':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-700/60 border border-slate-600 text-slate-300 text-[11px] font-medium tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            IDLE
          </div>
        );
      case 'STOPPED':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            STOPPED
          </div>
        );
      case 'CONNECTING':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[11px] font-medium tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
            CONNECTING
          </div>
        );
      case 'OFFLINE':
      case 'ERROR':
      default:
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[11px] font-medium tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            OFFLINE
          </div>
        );
    }
  };

  // Compact Mini Badge Bar
  if (isPrinterPanelCompact) {
    return (
      <div
        onClick={togglePrinterCompact}
        className="absolute bottom-3 left-3 z-30 flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/85 hover:bg-slate-800/90 backdrop-blur-md border border-white/10 hover:border-white/20 shadow-2xl text-xs text-slate-200 select-none cursor-pointer transition"
      >
        <div className="flex items-center gap-2">
          <Printer size={14} className="text-orange-400" />
          <span className="font-semibold text-white">Prusa Core One L</span>
          {getStateBadge()}
          {progress !== undefined && (
            <span className="font-mono font-bold text-sky-400 pl-1">{progress.toFixed(0)}%</span>
          )}
        </div>
        <div
          title="Expand Panel"
          className="p-1 rounded text-slate-400 hover:text-white transition ml-1"
        >
          <ChevronUp size={13} />
        </div>
      </div>
    );
  }

  // Full Expanded Panel
  return (
    <div className="absolute bottom-3 left-3 z-30 w-72 sm:w-80 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden select-none transition-all duration-200">
      {/* Header */}
      <div
        onClick={togglePrinterCompact}
        className="flex items-center justify-between px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border-b border-white/10 cursor-pointer transition select-none"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <Printer size={14} />
          </div>
          <div>
            <div className="text-xs font-semibold text-white leading-tight">Prusa Core One L</div>
            <div className="text-[10px] text-slate-400 font-mono">192.168.0.133</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {getStateBadge()}
          <div
            title="Minimize to pill"
            className="p-1 rounded text-slate-400 hover:text-white transition ml-1"
          >
            <ChevronDown size={13} />
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-3.5 space-y-3">
        {/* Offline / Error notice if any */}
        {isOffline && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <AlertCircle size={14} className="shrink-0 text-rose-400" />
              <span className="truncate">{printerData?.error || 'Cannot connect to printer'}</span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-[11px] font-medium text-sky-400 hover:underline shrink-0 ml-2"
            >
              Config
            </button>
          </div>
        )}

        {/* Progress Section (when printing or job active) */}
        {(isPrinting || isPaused || progress !== undefined) && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 truncate max-w-[170px]">
                <FileCode size={12} className="text-sky-400 shrink-0" />
                <span className="truncate" title={printerData?.job?.name || 'Active Print'}>
                  {printerData?.job?.name || 'Current Job'}
                </span>
              </span>
              <span className="text-sm font-extrabold font-mono text-sky-400">
                {progress !== undefined ? `${progress.toFixed(0)}%` : '--%'}
              </span>
            </div>

            {/* Glowing progress bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5 relative">
              <div
                className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                style={{ width: `${Math.min(100, Math.max(0, progress || 0))}%` }}
              />
            </div>

            {/* Time Remaining & Elapsed */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <span className="flex items-center gap-1">
                <Clock size={11} className="text-slate-400" />
                <span>Left: <strong className="text-slate-200 font-mono">{formatDuration(printerData?.job?.timeRemaining)}</strong></span>
              </span>
              {printerData?.job?.timePrinting !== undefined && (
                <span>
                  Elapsed: <strong className="text-slate-200 font-mono">{formatDuration(printerData?.job?.timePrinting)}</strong>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stopped status banner */}
        {isStopped && !progress && (
          <div className="py-2 text-center text-xs text-amber-300/90 bg-amber-500/10 rounded-lg border border-amber-500/20">
            Print was stopped
          </div>
        )}

        {/* Idle status banner if idle */}
        {isIdle && (
          <div className="py-2 text-center text-xs text-slate-400 bg-white/5 rounded-lg border border-white/5">
            Printer is ready and idle
          </div>
        )}

        {/* Telemetry (Temperatures & Z-Height) */}
        {printerData?.telemetry && (
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 text-[11px]">
            {/* Nozzle */}
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/60 border border-white/5">
              <Flame size={13} className="text-orange-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 uppercase">Nozzle</div>
                <div className="font-mono font-medium text-slate-200">
                  {printerData.telemetry.tempNozzle !== undefined ? `${Math.round(printerData.telemetry.tempNozzle)}°C` : '--'}
                  {printerData.telemetry.targetNozzle ? (
                    <span className="text-slate-400 text-[10px]"> / {Math.round(printerData.telemetry.targetNozzle)}°C</span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Bed */}
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/60 border border-white/5">
              <Layers size={13} className="text-sky-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 uppercase">Heatbed</div>
                <div className="font-mono font-medium text-slate-200">
                  {printerData.telemetry.tempBed !== undefined ? `${Math.round(printerData.telemetry.tempBed)}°C` : '--'}
                  {printerData.telemetry.targetBed ? (
                    <span className="text-slate-400 text-[10px]"> / {Math.round(printerData.telemetry.targetBed)}°C</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
