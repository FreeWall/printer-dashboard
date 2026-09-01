import React, { useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { VideoPlayer } from './components/VideoPlayer';
import { SettingsModal } from './components/SettingsModal';
import { PrinterStatusPanel } from './components/PrinterStatusPanel';
import { useStreamStore } from './store/useStreamStore';

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reconnectKey, setReconnectKey] = useState(0);
  const {
    initFromConfig,
    setIsMaximized,
    setPrinterData,
    isMaximized,
  } = useStreamStore();

  useEffect(() => {
    if (window.electronAPI) {
      // 1. Get initial configuration
      window.electronAPI.getConfig().then((config) => {
        if (config) {
          initFromConfig(config);
        }
      });

      // 2. Get initial printer status
      window.electronAPI.getPrinterStatus?.().then((status) => {
        if (status) {
          setPrinterData(status);
        }
      });

      // 3. Maximized check
      window.electronAPI.isMaximized().then((max) => {
        setIsMaximized(max);
      });

      // 4. Config changes
      const cleanupConfig = window.electronAPI.onStreamConfigChange((config) => {
        if (config) {
          initFromConfig(config);
        }
      });

      // 5. Maximized changes
      const cleanupMaximized = window.electronAPI.onMaximizedChange((isMax) => {
        setIsMaximized(isMax);
      });

      // 6. Real-time Printer Status stream
      const cleanupPrinter = window.electronAPI.onPrinterStatusChange?.((data) => {
        if (data) {
          setPrinterData(data);
        }
      });

      return () => {
        cleanupConfig();
        cleanupMaximized();
        if (cleanupPrinter) cleanupPrinter();
      };
    }
  }, []);

  const handleReconnect = () => {
    setReconnectKey((prev) => prev + 1);
  };

  return (
    <div
      className={`w-screen h-screen flex flex-col bg-slate-950/95 overflow-hidden transition-all duration-150 relative ${
        isMaximized
          ? 'rounded-none border-0'
          : 'rounded-2xl border border-white/10 shadow-2xl glass-panel'
      }`}
    >
      <Header onReconnect={handleReconnect} />

      <main className="flex-1 min-h-0 relative overflow-hidden bg-black">
        <VideoPlayer
          key={reconnectKey}
          canvasRef={canvasRef}
          onReconnect={handleReconnect}
        />
        <PrinterStatusPanel />
        <SettingsModal />
      </main>
    </div>
  );
};

export default App;
