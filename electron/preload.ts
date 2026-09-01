import { contextBridge, ipcRenderer } from 'electron';

export interface AppConfig {
  rtspUrl: string;
  streamPort: number;
  isAlwaysOnTop: boolean;
  printerUrl: string;
  printerApiKey: string;
  printerEnabled: boolean;
}

export interface ElectronAPI {
  toggleAlwaysOnTop: () => Promise<boolean>;
  isAlwaysOnTop: () => Promise<boolean>;
  closeWindow: () => Promise<void>;
  minimizeWindow: () => Promise<void>;
  toggleMaximize: () => Promise<boolean>;
  isMaximized: () => Promise<boolean>;
  getConfig: () => Promise<AppConfig>;
  setRtspUrl: (url: string) => Promise<boolean>;
  setPrinterConfig: (config: { printerUrl?: string; printerApiKey?: string; printerEnabled?: boolean }) => Promise<boolean>;
  getPrinterStatus: () => Promise<any>;
  saveSnapshot: (dataUrl: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  onStreamConfigChange: (callback: (config: AppConfig) => void) => () => void;
  onMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
  onPrinterStatusChange: (callback: (data: any) => void) => () => void;
}

const electronAPI: ElectronAPI = {
  toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top'),
  isAlwaysOnTop: () => ipcRenderer.invoke('is-always-on-top'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  toggleMaximize: () => ipcRenderer.invoke('toggle-maximize'),
  isMaximized: () => ipcRenderer.invoke('is-maximized'),
  getConfig: () => ipcRenderer.invoke('get-config'),
  setRtspUrl: (url: string) => ipcRenderer.invoke('set-rtsp-url', url),
  setPrinterConfig: (config) => ipcRenderer.invoke('set-printer-config', config),
  getPrinterStatus: () => ipcRenderer.invoke('get-printer-status'),
  saveSnapshot: (dataUrl: string) => ipcRenderer.invoke('save-snapshot', dataUrl),
  onStreamConfigChange: (callback: (config: AppConfig) => void) => {
    const handler = (_event: any, config: AppConfig) => callback(config);
    ipcRenderer.on('stream-config-changed', handler);
    return () => {
      ipcRenderer.removeListener('stream-config-changed', handler);
    };
  },
  onMaximizedChange: (callback: (isMaximized: boolean) => void) => {
    const handler = (_event: any, isMax: boolean) => callback(isMax);
    ipcRenderer.on('window-maximized-change', handler);
    return () => {
      ipcRenderer.removeListener('window-maximized-change', handler);
    };
  },
  onPrinterStatusChange: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('printer-status-updated', handler);
    return () => {
      ipcRenderer.removeListener('printer-status-updated', handler);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
