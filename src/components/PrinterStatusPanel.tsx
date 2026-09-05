import React from "react";
import { useStreamStore } from "../store/useStreamStore";
import {
  Flame,
  Layers,
  Clock,
  Hourglass,
  AlertCircle,
  Repeat,
} from "lucide-react";
import { PrinterStateBadge } from "./PrinterStateBadge";
import { formatDuration } from "../utils/format";

export const PrinterStatusPanel: React.FC = () => {
  const { printerData, printerEnabled, setIsSettingsOpen } = useStreamStore();

  if (!printerEnabled) return null;

  const state = printerData?.state || "OFFLINE";
  const telemetry = printerData?.telemetry;
  const job = printerData?.job;
  const progress = job?.progress;
  const filamentChangeIn = job?.filamentChangeIn ?? job?.filament_change_in;
  const isPrinting = state === "PRINTING";
  const isPaused = state === "PAUSED";
  const isFinished = state === "FINISHED";
  const showProgress =
    progress !== undefined &&
    (isPrinting || isPaused || isFinished || progress > 0);

  const hasNozzle = telemetry?.tempNozzle !== undefined;
  const hasBed = telemetry?.tempBed !== undefined;

  return (
    <aside className="w-52 shrink-0 h-full bg-slate-900/100 border-r border-white/10 flex flex-col p-3.5 gap-3.5 select-none overflow-y-auto">
      {/* Status Badge & Progress */}
      <div className="flex items-center gap-2 pb-3 border-b border-white/10">
        <PrinterStateBadge state={state} />
        {showProgress && (
          <div className="flex items-center px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-400 font-mono font-extrabold text-xs tracking-tight shadow-[0_0_8px_rgba(56,189,248,0.2)]">
            {progress.toFixed(0)}%
          </div>
        )}
      </div>

      {/* Active Job Info (if any) */}
      {job && (isPrinting || isPaused || showProgress) && (
        <div className="pb-3 border-b border-white/10">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl flex flex-col gap-1 shadow-sm min-w-0">
              <div className="flex items-center gap-1 text-slate-400">
                <Hourglass size={12} className="text-slate-400 shrink-0" />
                <span className="text-[10px] font-medium uppercase tracking-wide truncate">
                  Left
                </span>
              </div>
              <div className="text-lg font-mono font-bold text-slate-100 truncate">
                {formatDuration(job.timeRemaining)}
              </div>
            </div>

            <div className="rounded-xl flex flex-col gap-1 shadow-sm min-w-0">
              <div className="flex items-center gap-1 text-slate-400">
                <Clock size={12} className="text-slate-400 shrink-0" />
                <span className="text-[10px] font-medium uppercase tracking-wide truncate">
                  Elapsed
                </span>
              </div>
              <div className="text-lg font-mono font-bold text-slate-100 truncate">
                {formatDuration(job.timePrinting)}
              </div>
            </div>

            {filamentChangeIn !== undefined && filamentChangeIn > 0 && (
              <div className="rounded-xl flex flex-col gap-1 shadow-sm min-w-0">
                <div className="flex items-center gap-1 text-slate-400">
                  <Repeat size={12} className="text-amber-400 shrink-0" />
                  <span className="text-[10px] font-medium uppercase tracking-wide truncate">
                    Change In
                  </span>
                </div>
                <div className="font-mono font-bold text-slate-100 truncate">
                  {formatDuration(filamentChangeIn)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Offline / Error notice if any */}
      {printerData?.error && (state === "OFFLINE" || state === "ERROR") && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 truncate">
            <AlertCircle size={13} className="shrink-0" />
            <span className="truncate text-[11px]">{printerData.error}</span>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="text-[10px] font-semibold text-sky-400 hover:underline shrink-0 ml-1.5"
          >
            Config
          </button>
        </div>
      )}

      {/* Temperatures */}
      <div className="grid grid-cols-2 gap-4">
        {/* Nozzle Card */}
        <div className="rounded-xl flex flex-col gap-1 shadow-sm min-w-0">
          <div className="flex items-center gap-1 text-slate-400">
            <Flame size={12} className="text-orange-400 shrink-0" />
            <span className="text-[10px] font-medium uppercase tracking-wide truncate">
              Nozzle
            </span>
          </div>
          <div className="font-mono flex items-baseline gap-0.5 truncate">
            <span className="text-lg font-bold text-slate-100">
              {hasNozzle ? `${Math.round(telemetry!.tempNozzle!)}°` : "--"}
            </span>
            {telemetry?.targetNozzle ? (
              <span className="text-sm font-bold text-slate-400">
                /{Math.round(telemetry.targetNozzle)}°
              </span>
            ) : null}
          </div>
        </div>

        {/* Heatbed Card */}
        <div className="rounded-xl flex flex-col gap-1 shadow-sm min-w-0">
          <div
            className="flex items-center gap-1 text-slate-400"
            title="Heatbed"
          >
            <Layers size={12} className="text-sky-400 shrink-0" />
            <span className="text-[10px] font-medium uppercase tracking-wide truncate">
              Bed
            </span>
          </div>
          <div className="font-mono flex items-baseline gap-0.5 truncate">
            <span className="text-lg font-bold text-slate-100">
              {hasBed ? `${Math.round(telemetry!.tempBed!)}°` : "--"}
            </span>
            {telemetry?.targetBed ? (
              <span className="text-sm font-bold text-slate-400">
                /{Math.round(telemetry.targetBed)}°
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
};
