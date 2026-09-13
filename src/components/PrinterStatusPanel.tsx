import React from 'react';
import { useStreamStore } from '../store/useStreamStore';
import { Flame, Layers, Clock, Hourglass, AlertCircle, Repeat, Fan } from 'lucide-react';
import { PrinterStateBadge } from './PrinterStateBadge';
import { formatDuration } from '../utils/format';

export const PrinterStatusPanel: React.FC = () => {
  const { printerData, printerEnabled, setIsSettingsOpen } = useStreamStore();

  if (!printerEnabled) return null;

  const state = printerData?.state || 'OFFLINE';
  const telemetry = printerData?.telemetry;
  const job = printerData?.job;
  const progress = job?.progress;
  const filamentChangeIn = job?.filamentChangeIn ?? job?.filament_change_in;
  const isPrinting = state === 'PRINTING';
  const isPaused = state === 'PAUSED';
  const isFinished = state === 'FINISHED';
  const showProgress =
    progress !== undefined && (isPrinting || isPaused || isFinished || progress > 0);

  const hasNozzle = telemetry?.tempNozzle !== undefined;
  const hasBed = telemetry?.tempBed !== undefined;
  const hasFans = telemetry?.fanHotend !== undefined || telemetry?.fanPrint !== undefined;

  return (
    <aside className="absolute bottom-0 left-0 top-0 z-10 flex h-full w-52 shrink-0 select-none flex-col gap-3.5 overflow-y-auto border-r border-white/10 bg-slate-900/90 p-3.5 backdrop-blur-md">
      {/* Status Badge & Progress */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <PrinterStateBadge state={state} />
        {showProgress && (
          <div className="flex items-center rounded-md border border-sky-500/30 bg-sky-500/15 px-2 py-0.5 font-mono text-xs font-extrabold tracking-tight text-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.2)]">
            {progress.toFixed(0)}%
          </div>
        )}
      </div>

      {/* Active Job Info (if any) */}
      {job && (isPrinting || isPaused || showProgress) && (
        <div className="border-b border-white/10 pb-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex min-w-0 flex-col gap-1 rounded-xl shadow-sm">
              <div className="flex items-center gap-1 text-slate-400">
                <Hourglass
                  size={12}
                  className="shrink-0 text-slate-400"
                />
                <span className="truncate text-[10px] font-medium uppercase tracking-wide">
                  Left
                </span>
              </div>
              <div className="truncate font-mono text-lg font-bold text-slate-100">
                {formatDuration(job.timeRemaining)}
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-1 rounded-xl shadow-sm">
              <div className="flex items-center gap-1 text-slate-400">
                <Clock
                  size={12}
                  className="shrink-0 text-slate-400"
                />
                <span className="truncate text-[10px] font-medium uppercase tracking-wide">
                  Elapsed
                </span>
              </div>
              <div className="truncate font-mono text-lg font-bold text-slate-100">
                {formatDuration(job.timePrinting)}
              </div>
            </div>

            {filamentChangeIn !== undefined && filamentChangeIn > 0 && (
              <div className="flex min-w-0 flex-col gap-1 rounded-xl shadow-sm">
                <div className="flex items-center gap-1 text-slate-400">
                  <Repeat
                    size={12}
                    className="shrink-0 text-amber-400"
                  />
                  <span className="truncate text-[10px] font-medium uppercase tracking-wide">
                    Change In
                  </span>
                </div>
                <div className="truncate font-mono font-bold text-slate-100">
                  {formatDuration(filamentChangeIn)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Offline / Error notice if any */}
      {printerData?.error && (state === 'OFFLINE' || state === 'ERROR') && (
        <div className="flex items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-400">
          <div className="flex items-center gap-1.5 truncate">
            <AlertCircle
              size={13}
              className="shrink-0"
            />
            <span className="truncate text-[11px]">{printerData.error}</span>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="ml-1.5 shrink-0 text-[10px] font-semibold text-sky-400 hover:underline"
          >
            Config
          </button>
        </div>
      )}

      {/* Temperatures */}
      <div className="grid grid-cols-2 gap-4">
        {/* Nozzle Card */}
        <div className="flex min-w-0 flex-col gap-1 rounded-xl shadow-sm">
          <div className="flex items-center gap-1 text-slate-400">
            <Flame
              size={12}
              className="shrink-0 text-orange-400"
            />
            <span className="truncate text-[10px] font-medium uppercase tracking-wide">Nozzle</span>
          </div>
          <div className="flex items-baseline gap-0.5 truncate font-mono">
            <span className="text-lg font-bold text-slate-100">
              {hasNozzle ? `${Math.round(telemetry!.tempNozzle!)}°` : '--'}
            </span>
            {telemetry?.targetNozzle ? (
              <span className="text-sm font-bold text-slate-400">
                /{Math.round(telemetry.targetNozzle)}°
              </span>
            ) : null}
          </div>
        </div>

        {/* Heatbed Card */}
        <div className="flex min-w-0 flex-col gap-1 rounded-xl shadow-sm">
          <div
            className="flex items-center gap-1 text-slate-400"
            title="Heatbed"
          >
            <Layers
              size={12}
              className="shrink-0 text-sky-400"
            />
            <span className="truncate text-[10px] font-medium uppercase tracking-wide">Bed</span>
          </div>
          <div className="flex items-baseline gap-0.5 truncate font-mono">
            <span className="text-lg font-bold text-slate-100">
              {hasBed ? `${Math.round(telemetry!.tempBed!)}°` : '--'}
            </span>
            {telemetry?.targetBed ? (
              <span className="text-sm font-bold text-slate-400">
                /{Math.round(telemetry.targetBed)}°
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Fans */}
      {hasFans && (
        <div className="grid grid-cols-2 gap-4">
          {/* Hotend Fan Card */}
          <div className="flex min-w-0 flex-col gap-1 rounded-xl shadow-sm">
            <div
              className="flex items-center gap-1 text-slate-400"
              title="Hotend Fan"
            >
              <Fan
                size={12}
                className="shrink-0 text-orange-400"
                style={{ animationDuration: '2s' }}
              />
              <span className="truncate text-[10px] font-medium uppercase tracking-wide">
                Hotend
              </span>
            </div>
            <div className="flex items-baseline gap-0.5 truncate font-mono">
              <span className="text-lg font-bold text-slate-100">
                {telemetry?.fanHotend !== undefined ? telemetry.fanHotend : '--'}
              </span>
              <span className="ml-0.5 text-[10px] font-medium text-slate-400">RPM</span>
            </div>
          </div>

          {/* Print Fan Card */}
          <div className="flex min-w-0 flex-col gap-1 rounded-xl shadow-sm">
            <div
              className="flex items-center gap-1 text-slate-400"
              title="Print Fan"
            >
              <Fan
                size={12}
                className="shrink-0 text-teal-400"
                style={{ animationDuration: '2s' }}
              />
              <span className="truncate text-[10px] font-medium uppercase tracking-wide">
                Print
              </span>
            </div>
            <div className="flex items-baseline gap-0.5 truncate font-mono">
              <span className="text-lg font-bold text-slate-100">
                {telemetry?.fanPrint !== undefined ? telemetry.fanPrint : '--'}
              </span>
              <span className="ml-0.5 text-[10px] font-medium text-slate-400">RPM</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
