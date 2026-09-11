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
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <span>Settings & Configuration</span>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="rounded-md p-1 text-slate-400 transition hover:text-slate-200"
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSave}
          className="space-y-4"
        >
          {/* Camera RTSP Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400">
              <Globe size={14} />
              <span>Camera Stream (RTSP)</span>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-300">Stream RTSP URL</label>
              <input
                type="text"
                value={inputRtspUrl}
                onChange={(e) => setInputRtspUrl(e.target.value)}
                placeholder="rtsp://192.168.0.121/live"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white transition focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="h-[1px] w-full bg-white/10" />

          {/* Prusa Printer Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-400">
                <Printer size={14} />
                <span>Prusa Core One (PrusaLink)</span>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="peer h-4 w-8 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-orange-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                <span className="ml-2 text-[11px] text-slate-300">Enable</span>
              </label>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-300">Printer IP / Address</label>
              <input
                type="text"
                value={inputPrinterUrl}
                onChange={(e) => setInputPrinterUrl(e.target.value)}
                placeholder="http://192.168.0.133"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white transition focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs text-slate-300">
                  <Key
                    size={12}
                    className="text-amber-400"
                  />
                  <span>PrusaLink API Key / Password</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
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
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white transition focus:border-orange-500 focus:outline-none"
              />
              <p className="mt-1 text-[10px] text-slate-400">
                Saved permanently in app config. On your printer:{' '}
                <em>Settings &gt; Network &gt; PrusaLink &gt; API Key / Password</em>.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 border-t border-white/10 pt-2">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="rounded-lg px-3.5 py-1.5 text-xs text-slate-300 transition hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-1.5 text-xs font-semibold text-slate-950 shadow transition hover:bg-sky-400"
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
