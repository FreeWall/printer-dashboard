import React from 'react';
import { Camera, Pin, PinOff, Settings, Minus, Square, Copy, X } from 'lucide-react';
import { useStreamStore } from '../store/useStreamStore';

export const Header: React.FC = () => {
  const {
    isAlwaysOnTop,
    setIsAlwaysOnTop,
    isMaximized,
    setIsMaximized,
    isSettingsOpen,
    setIsSettingsOpen,
  } = useStreamStore();

  const handleTogglePin = async () => {
    if (window.electronAPI) {
      const next = await window.electronAPI.toggleAlwaysOnTop();
      setIsAlwaysOnTop(next);
    } else {
      setIsAlwaysOnTop(!isAlwaysOnTop);
    }
  };

  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow();
  };

  const handleToggleMaximize = async () => {
    if (window.electronAPI) {
      const next = await window.electronAPI.toggleMaximize();
      setIsMaximized(next);
    }
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  return (
    <header className="drag-handle flex w-full cursor-default select-none items-center justify-between border-b border-white/10 bg-slate-900 px-3 py-2">
      {/* Stream Camera Title */}
      <div className="flex items-center gap-2.5">
        <div className="shrink-0 rounded-lg border border-sky-500/30 bg-sky-500/20 p-1 text-sky-400">
          <Camera size={15} />
        </div>
        <span className="whitespace-nowrap text-xs font-semibold tracking-tight text-white">
          Prusa Core One L+
        </span>
      </div>

      {/* Right: Window & App Actions */}
      <div className="no-drag flex items-center gap-1">
        <button
          onClick={handleTogglePin}
          title={isAlwaysOnTop ? 'Unpin (Always on top)' : 'Pin on top'}
          className={`rounded-md p-1.5 transition-colors ${
            isAlwaysOnTop
              ? 'border border-sky-500/40 bg-sky-500/20 text-sky-400 hover:bg-sky-500/30'
              : 'border border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
          }`}
        >
          {isAlwaysOnTop ? (
            <Pin
              size={13}
              className="rotate-45"
            />
          ) : (
            <PinOff size={13} />
          )}
        </button>

        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          title="Settings / Stream URL & Printer"
          className={`rounded-md p-1.5 transition-colors ${
            isSettingsOpen
              ? 'bg-sky-500/20 text-sky-400'
              : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
          }`}
        >
          <Settings size={13} />
        </button>

        <div className="mx-1 h-3.5 w-[1px] bg-white/10" />

        <button
          onClick={handleMinimize}
          title="Minimize"
          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
        >
          <Minus size={13} />
        </button>

        <button
          onClick={handleToggleMaximize}
          title={isMaximized ? 'Restore Window' : 'Maximize Window'}
          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
        >
          {isMaximized ? (
            <Copy
              size={12}
              className="rotate-180"
            />
          ) : (
            <Square size={12} />
          )}
        </button>

        <button
          onClick={handleClose}
          title="Hide to Tray"
          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
        >
          <X size={13} />
        </button>
      </div>
    </header>
  );
};
