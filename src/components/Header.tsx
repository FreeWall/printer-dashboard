import React from 'react';
import { Camera, Pin, PinOff, Settings, Minus, Square, Copy, X, RefreshCw } from 'lucide-react';
import { useStreamStore } from '../store/useStreamStore';

interface HeaderProps {
  onReconnect?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReconnect }) => {
  const {
    status,
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

  const getStatusBadge = () => {
    switch (status) {
      case 'live':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
            LIVE
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-medium uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            CONNECTING
          </div>
        );
      case 'disconnected':
      case 'error':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-medium uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            OFFLINE
          </div>
        );
    }
  };

  return (
    <header
      className="drag-handle w-full flex items-center justify-between px-3 py-2 bg-slate-900/95 border-b border-white/10 select-none cursor-default"
    >
      <div className="flex items-center gap-2.5">
        <div className="p-1 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
          <Camera size={15} />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs tracking-tight text-white">Prusa Core One L+</span>
          {getStatusBadge()}
          {onReconnect && (
            <button
              onClick={onReconnect}
              title="Reconnect Stream"
              className="no-drag p-1 rounded-md text-slate-400 hover:text-sky-300 hover:bg-white/5 transition-colors"
            >
              <RefreshCw size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="no-drag flex items-center gap-1">
        <button
          onClick={handleTogglePin}
          title={isAlwaysOnTop ? 'Unpin (Always on top)' : 'Pin on top'}
          className={`p-1.5 rounded-md transition-colors ${
            isAlwaysOnTop
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 hover:bg-sky-500/30'
              : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/5'
          }`}
        >
          {isAlwaysOnTop ? <Pin size={13} className="rotate-45" /> : <PinOff size={13} />}
        </button>

        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          title="Settings / Stream URL & Printer"
          className={`p-1.5 rounded-md transition-colors ${
            isSettingsOpen
              ? 'bg-sky-500/20 text-sky-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Settings size={13} />
        </button>

        <div className="w-[1px] h-3.5 bg-white/10 mx-1" />

        <button
          onClick={handleMinimize}
          title="Minimize"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-md transition-colors"
        >
          <Minus size={13} />
        </button>

        <button
          onClick={handleToggleMaximize}
          title={isMaximized ? 'Restore Window' : 'Maximize Window'}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-md transition-colors"
        >
          {isMaximized ? <Copy size={12} className="rotate-180" /> : <Square size={12} />}
        </button>

        <button
          onClick={handleClose}
          title="Hide to Tray"
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
        >
          <X size={13} />
        </button>
      </div>
    </header>
  );
};
