import React, { useState, useEffect } from 'react';
import { X, Check, Globe, Printer, Key, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useStreamStore } from '../store/useStreamStore';

export const SettingsModal: React.FC = () => {
  const {
    rtspUrl,
    setRtspUrl,
    printerUrl,
    printerApiKey,
    printerEnabled,
    setPrinterConfig,
    isSettingsOpen,
    setIsSettingsOpen,
  } = useStreamStore();

  const [inputRtspUrl, setInputRtspUrl] = useState(rtspUrl);
  const [inputPrinterUrl, setInputPrinterUrl] = useState(printerUrl);
  const [inputApiKey, setInputApiKey] = useState(printerApiKey);
  const [enabled, setEnabled] = useState(printerEnabled);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setInputRtspUrl(rtspUrl);
    setInputPrinterUrl(printerUrl);
    setInputApiKey(printerApiKey);
    setEnabled(printerEnabled);
  }, [rtspUrl, printerUrl, printerApiKey, printerEnabled, isSettingsOpen]);

  if (!isSettingsOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanRtsp = inputRtspUrl.trim();
    const cleanPrinter = inputPrinterUrl.trim();
    const cleanKey = inputApiKey.trim();

    if (cleanRtsp) {
      setRtspUrl(cleanRtsp);
      if (window.electronAPI) {
        await window.electronAPI.setRtspUrl(cleanRtsp);
      }
    }

    setPrinterConfig({
      printerUrl: cleanPrinter,
      printerApiKey: cleanKey,
      printerEnabled: enabled,
    });

    if (window.electronAPI) {
      await window.electronAPI.setPrinterConfig({
        printerUrl: cleanPrinter,
        printerApiKey: cleanKey,
        printerEnabled: enabled,
      });
    }

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setIsSettingsOpen(false);
    }, 600);
  };

  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <span>Settings & Configuration</span>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md transition"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Camera RTSP Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider">
              <Globe size={14} />
              <span>Camera Stream (RTSP)</span>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Stream RTSP URL
              </label>
              <input
                type="text"
                value={inputRtspUrl}
                onChange={(e) => setInputRtspUrl(e.target.value)}
                placeholder="rtsp://192.168.0.121/live"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-sky-500 transition"
              />
            </div>
          </div>

          <div className="w-full h-[1px] bg-white/10" />

          {/* Prusa Printer Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
                <Printer size={14} />
                <span>Prusa Core One (PrusaLink)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-orange-500"></div>
                <span className="ml-2 text-[11px] text-slate-300">Enable</span>
              </label>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Printer IP / Address
              </label>
              <input
                type="text"
                value={inputPrinterUrl}
                onChange={(e) => setInputPrinterUrl(e.target.value)}
                placeholder="http://192.168.0.133"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-orange-500 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-300 flex items-center gap-1.5">
                  <Key size={12} className="text-amber-400" />
                  <span>PrusaLink API Key / Password</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  {showApiKey ? <EyeOff size={12} /> : <Eye size={12} />}
                  <span>{showApiKey ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <input
                type={showApiKey ? 'text' : 'password'}
                value={inputApiKey}
                onChange={(e) => setInputApiKey(e.target.value)}
                placeholder="Enter API key from printer LCD"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-orange-500 transition"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Saved permanently in app config. On your printer: <em>Settings &gt; Network &gt; PrusaLink &gt; API Key / Password</em>.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 transition shadow"
            >
              {saved ? <Check size={14} /> : <ShieldCheck size={14} />}
              <span>{saved ? 'Saved!' : 'Save & Connect'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
