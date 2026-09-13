import { create } from 'zustand';
import { StreamStatus, PrinterData, AppConfig } from '../types';

interface StreamState {
  // Video Stream
  rtspUrl: string;
  streamPort: number;
  status: StreamStatus;
  isAlwaysOnTop: boolean;
  isMaximized: boolean;
  isSettingsOpen: boolean;
  aspectRatio: 'contain' | 'cover';

  // Printer Status
  printerUrl: string;
  printerApiKey: string;
  printerEnabled: boolean;
  printerData: PrinterData | null;

  // Actions
  setRtspUrl: (url: string) => void;
  setStatus: (status: StreamStatus) => void;
  setIsAlwaysOnTop: (val: boolean) => void;
  setIsMaximized: (val: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setAspectRatio: (ratio: 'contain' | 'cover') => void;

  setPrinterConfig: (config: {
    printerUrl?: string;
    printerApiKey?: string;
    printerEnabled?: boolean;
  }) => void;
  setPrinterData: (data: PrinterData) => void;
  initFromConfig: (config: AppConfig) => void;
}

export const useStreamStore = create<StreamState>((set) => ({
  rtspUrl: 'rtsp://192.168.0.121/live',
  streamPort: 31415,
  status: 'connecting',
  isAlwaysOnTop: false,
  isMaximized: false,
  isSettingsOpen: false,
  aspectRatio: 'contain',

  printerUrl: 'http://192.168.0.133',
  printerApiKey: '',
  printerEnabled: true,
  printerData: null,

  setRtspUrl: (rtspUrl) => set({ rtspUrl }),
  setStatus: (status) =>
    set((state) => (state.status === status ? state : { status })),
  setIsAlwaysOnTop: (isAlwaysOnTop) => set({ isAlwaysOnTop }),
  setIsMaximized: (isMaximized) => set({ isMaximized }),
  setIsSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),

  setPrinterConfig: (config) =>
    set((state) => ({
      printerUrl: config.printerUrl !== undefined ? config.printerUrl : state.printerUrl,
      printerApiKey:
        config.printerApiKey !== undefined ? config.printerApiKey : state.printerApiKey,
      printerEnabled:
        config.printerEnabled !== undefined ? config.printerEnabled : state.printerEnabled,
    })),
  setPrinterData: (printerData) => set({ printerData }),

  initFromConfig: (config) =>
    set({
      rtspUrl: config.rtspUrl,
      streamPort: config.streamPort,
      isAlwaysOnTop: config.isAlwaysOnTop,
      printerUrl: config.printerUrl || 'http://192.168.0.133',
      printerApiKey: config.printerApiKey || '',
      printerEnabled: config.printerEnabled ?? true,
    }),
}));
