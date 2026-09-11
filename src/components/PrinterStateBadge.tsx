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
        <div
          className={`flex items-center gap-1.5 rounded-full border border-sky-500/40 bg-sky-500/20 px-2 py-0.5 text-[11px] font-bold tracking-wide text-sky-400 ${className}`}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
          PRINTING
        </div>
      );
    case 'PAUSED':
      return (
        <div
          className={`flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold tracking-wide text-amber-400 ${className}`}
        >
          <PauseCircle size={12} />
          PAUSED
        </div>
      );
    case 'FINISHED':
      return (
        <div
          className={`flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold tracking-wide text-emerald-400 ${className}`}
        >
          <CheckCircle2 size={12} />
          FINISHED
        </div>
      );
    case 'BUSY':
    case 'ATTENTION':
      return (
        <div
          className={`flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-500/20 px-2 py-0.5 text-[11px] font-bold tracking-wide text-orange-400 ${className}`}
        >
          <AlertCircle size={12} />
          {state}
        </div>
      );
    case 'READY':
    case 'IDLE':
      return (
        <div
          className={`flex items-center gap-1.5 rounded-full border border-slate-600 bg-slate-700/60 px-2 py-0.5 text-[11px] font-medium tracking-wide text-slate-300 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          IDLE
        </div>
      );
    case 'STOPPED':
      return (
        <div
          className={`flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/20 px-2 py-0.5 text-[11px] font-bold tracking-wide text-rose-300 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
          STOPPED
        </div>
      );
    case 'CONNECTING':
      return (
        <div
          className={`flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/15 px-2 py-0.5 text-[11px] font-medium tracking-wide text-sky-400 ${className}`}
        >
          <span className="h-1.5 w-1.5 animate-ping rounded-full bg-sky-400" />
          CONNECTING
        </div>
      );
    case 'OFFLINE':
    case 'ERROR':
    default:
      return (
        <div
          className={`flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/15 px-2 py-0.5 text-[11px] font-medium tracking-wide text-rose-400 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
          OFFLINE
        </div>
      );
  }
};
