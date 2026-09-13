import React, { useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { ProgressBar } from "./components/ProgressBar";
import { VideoPlayer } from "./components/VideoPlayer";
import { SettingsModal } from "./components/SettingsModal";
import { PrinterStatusPanel } from "./components/PrinterStatusPanel";
import { useStreamStore } from "./store/useStreamStore";
import finishedSound from "../assets/finished-sound.mp3";

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { initFromConfig, setIsMaximized, setPrinterData, isMaximized } =
    useStreamStore();

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
      const cleanupConfig = window.electronAPI.onStreamConfigChange(
        (config) => {
          if (config) {
            initFromConfig(config);
          }
        },
      );

      // 5. Maximized changes
      const cleanupMaximized = window.electronAPI.onMaximizedChange((isMax) => {
        setIsMaximized(isMax);
      });

      // 6. Real-time Printer Status stream
      const cleanupPrinter = window.electronAPI.onPrinterStatusChange?.(
        (data) => {
          if (data) {
            setPrinterData(data);
          }
        },
      );

      // 7. Play sound on printer finished
      const finishedAudio = new Audio(finishedSound);
      finishedAudio.preload = "auto";

      const cleanupFinished = window.electronAPI.onPrinterFinished?.(() => {
        finishedAudio.currentTime = 0;
        finishedAudio.volume = 0.7;
        finishedAudio.play().catch((err) => {
          console.error("Failed to play finished sound:", err);
        });
      });

      return () => {
        cleanupConfig();
        cleanupMaximized();
        if (cleanupPrinter) cleanupPrinter();
        if (cleanupFinished) cleanupFinished();
      };
    }
  }, []);

  return (
    <div
      className={`w-screen h-screen flex flex-col bg-slate-950/95 overflow-hidden  relative ${
        isMaximized ? "rounded-none border-0" : "rounded-2xl"
      }`}
    >
      <Header />

      <main className="relative min-h-0 flex-1 overflow-hidden bg-black">
        <ProgressBar />
        <VideoPlayer canvasRef={canvasRef} />
        <PrinterStatusPanel />
        <SettingsModal />
      </main>
    </div>
  );
};

export default App;
