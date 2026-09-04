import React from 'react';
import { AlertCircle, CheckCircle2, PauseCircle } from 'lucide-react';
import { PrinterState } from '../types';

interface PrinterStateBadgeProps {
  state: PrinterState;
  className?: string;
}

export const PrinterStateBadge: React.FC<PrinterStateBadgeProps> = ({ state, className = '' }) => {
  switch (state) {
    case 'PRINTING':
      return (
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-400 text-[11px] font-bold tracking-wide ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse shadow-[0_0_8px_#38bdf8]" />
          PRINTING
        </div>
      );
    case 'PAUSED':
      return (
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[11px] font-bold tracking-wide ${className}`}>
          <PauseCircle size={12} />
          PAUSED
        </div>
      );
    case 'FINISHED':
      return (
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold tracking-wide ${className}`}>
          <CheckCircle2 size={12} />
          FINISHED
        </div>
      );
    case 'BUSY':
    case 'ATTENTION':
      return (
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-[11px] font-bold tracking-wide ${className}`}>
          <AlertCircle size={12} />
          {state}
        </div>
      );
    case 'READY':
    case 'IDLE':
      return (
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-700/60 border border-slate-600 text-slate-300 text-[11px] font-medium tracking-wide ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          IDLE
        </div>
      );
    case 'STOPPED':
      return (
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold tracking-wide ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          STOPPED
        </div>
      );
    case 'CONNECTING':
      return (
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[11px] font-medium tracking-wide ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
          CONNECTING
        </div>
      );
    case 'OFFLINE':
    case 'ERROR':
    default:
      return (
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[11px] font-medium tracking-wide ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          OFFLINE
        </div>
      );
  }
};
