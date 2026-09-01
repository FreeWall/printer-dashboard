export type StreamStatus = 'connecting' | 'live' | 'error' | 'disconnected';

export type PrinterState =
  | 'PRINTING'
  | 'PAUSED'
  | 'IDLE'
  | 'READY'
  | 'BUSY'
  | 'STOPPED'
  | 'FINISHED'
  | 'ATTENTION'
  | 'ERROR'
  | 'OFFLINE'
  | 'CONNECTING';

export interface PrinterTelemetry {
  tempNozzle?: number;
  targetNozzle?: number;
  tempBed?: number;
  targetBed?: number;
  axisZ?: number;
  speed?: number;
  flow?: number;
}

export interface PrinterJob {
  id?: number;
  name?: string;
  progress?: number; // 0 - 100
  timeRemaining?: number; // seconds
  timePrinting?: number; // seconds
}

export interface PrinterData {
  state: PrinterState;
  stateText: string;
  isConnected: boolean;
  job?: PrinterJob;
  telemetry?: PrinterTelemetry;
  error?: string;
  lastUpdated: number;
}

export interface AppConfig {
  rtspUrl: string;
  streamPort: number;
  isAlwaysOnTop: boolean;
  printerUrl: string;
  printerApiKey: string;
  printerEnabled: boolean;
}

export interface StreamSettings {
  rtspUrl: string;
  isAlwaysOnTop: boolean;
  aspectRatio: 'contain' | 'cover';
  streamPort: number;
}

declare global {
  interface Window {
    electronAPI?: {
      toggleAlwaysOnTop: () => Promise<boolean>;
      isAlwaysOnTop: () => Promise<boolean>;
      closeWindow: () => Promise<void>;
      minimizeWindow: () => Promise<void>;
      toggleMaximize: () => Promise<boolean>;
      isMaximized: () => Promise<boolean>;
      getConfig: () => Promise<AppConfig>;
      setRtspUrl: (url: string) => Promise<boolean>;
      setPrinterConfig: (config: { printerUrl?: string; printerApiKey?: string; printerEnabled?: boolean }) => Promise<boolean>;
      getPrinterStatus: () => Promise<PrinterData>;
      saveSnapshot: (dataUrl: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      onStreamConfigChange: (callback: (config: AppConfig) => void) => () => void;
      onMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
      onPrinterStatusChange: (callback: (data: PrinterData) => void) => () => void;
    };
    JSMpeg: any;
  }
}
