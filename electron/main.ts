import {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  Tray,
  Menu,
  nativeImage,
  Notification,
} from "electron";
import * as path from "path";
import * as fs from "fs";
import { WebSocketServer, WebSocket } from "ws";
import { spawn, ChildProcess } from "child_process";

if (process.platform === "linux") {
  app.setName("printer-dashboard");
  // @ts-ignore
  app.setDesktopName("printer-dashboard.desktop");
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

interface SavedConfig {
  rtspUrl?: string;
  streamPort?: number;
  isAlwaysOnTop?: boolean;
  printerUrl?: string;
  printerApiKey?: string;
  printerEnabled?: boolean;
}

function getConfigPath(): string {
  return path.join(app.getPath("userData"), "printer-dashboard-config.json");
}

function loadConfig(): SavedConfig {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to read config file:", err);
  }
  return {};
}

function saveConfig(updates: Partial<SavedConfig>) {
  try {
    const current = loadConfig();
    const merged = { ...current, ...updates };
    const configPath = getConfigPath();
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(merged, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save config file:", err);
  }
}

const saved = loadConfig();

let currentRtspUrl =
  saved.rtspUrl || process.env.RTSP_URL || "rtsp://192.168.0.121/live";
const STREAM_PORT =
  saved.streamPort || Number(process.env.STREAM_PORT) || 31415;
let isAlwaysOnTop = saved.isAlwaysOnTop ?? false;
let printerUrl =
  saved.printerUrl || process.env.PRINTER_URL || "http://192.168.0.133";
let printerApiKey = saved.printerApiKey || process.env.PRUSA_API_KEY || "";
let printerEnabled = saved.printerEnabled ?? true;

const TRAY_ICON_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAACq0lEQVRYhe2WS0wTURSGv2GG8ihIeQjIIyHGGKJIYuICfCSVxoToRvEVFsDaRIMbRBdiYmOixMSwYO2CjSEB3RgXWNCAKZqoPOKissEQqlKhhT6gddpxgcWOCJ1pysr+uznn3HO+e++59w6klNL/LkFTlNVuThMY0ZM4onCS2/Wv4sWlaUkmCNzRU1zPmPgAVrtZALNuADBjtccdFxcgkdnrGavqgYP9iiG3KGgVIrQoAnsSLbyFnECfdzGj69MlIRQ1SrERuYXBuyjcULS1pl6VAZ25hUGAm1GjagsEhdZkVvSnP8WVcQ2/9CzW3Bb7oVoBTcuuRFgefY5nZJDV2c8AZFXtx9Rwnrzjp0H4M6eAOIJCkIA0jFE+GzWXbgkQTxE5hPNRB96Poyp7wDFJwDHJytuXlF/vJk0yAJAtNxCQhsmWLVvmVO12nW1N2Q7g2+P7uIf6EY27KG5uJ+fwCUDB92GUhSc9hP1eChqbKWnt2HYi45bMjbqaLiIAeek7HtsAgiiy91Yv965cpLG6GCl/NyZLE5WdvQhpIu6hfuSlBa1ptQP4puwokTDG2qNUHqjhXLnImVJxw5+1rwZjbT1KOIx/elwzgOYekJeXADCUVfF1TaHtXQhXUB1jKKuCiTF+en4kH0DKKwAg5JwFYMa3uV2ivnRTkWYAzVuQU1uPIIr4Jt6w6pjY5F+dmcY/ZUcQRYyH6pIPIBWUkG+5AEqEuYfteGyDyG4XstuF2zbAXPdVlEgY06nLSAXFmgF0HcOIHGK+pxPf+9f/9OccMVPR/gBBTN+2aOwx1AUArN+EYy9wDw8S/OIAILOqGlNDE3nHGlU3YSIA86w/Gjup+XFLZkX042/cvh0ujoCiqqE6ht7FjK7fz2ULyV8JJ9C3spiZ8A9OSintiH4BZCXfQXmuHLoAAAAASUVORK5CYII=";

// Custom RTSP to MPEG-TS WebSocket Relay
let wss: WebSocketServer | null = null;
let ffmpegProcess: ChildProcess | null = null;

function stopFfmpeg() {
  if (ffmpegProcess) {
    console.log("[FFmpeg] Stopping process...");
    try {
      ffmpegProcess.kill("SIGKILL");
    } catch (e) {
      // ignore
    }
    ffmpegProcess = null;
  }
}

function startFfmpeg() {
  stopFfmpeg();

  console.log(`[FFmpeg] Spawning relay for ${currentRtspUrl}...`);
  ffmpegProcess = spawn("ffmpeg", [
    "-rtsp_transport",
    "tcp",
    "-i",
    currentRtspUrl,
    "-f",
    "mpegts",
    "-codec:v",
    "mpeg1video",
    "-r",
    "25",
    "-b:v",
    "2500k",
    "-maxrate",
    "3000k",
    "-bufsize",
    "2000k",
    "-bf",
    "0",
    "-an",
    "-",
  ]);

  ffmpegProcess.stdout?.on("data", (data: Buffer) => {
    if (!wss) return;
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  });

  ffmpegProcess.stderr?.on("data", (data: Buffer) => {
    const msg = data.toString();
    if (
      msg.includes("error") ||
      msg.includes("Error") ||
      msg.includes("Input #0")
    ) {
      console.log("[FFmpeg]", msg.trim());
    }
  });

  ffmpegProcess.on("exit", (code, signal) => {
    console.log(`[FFmpeg] Exited (code: ${code}, signal: ${signal})`);
    ffmpegProcess = null;
  });

  ffmpegProcess.on("error", (err) => {
    console.error("[FFmpeg] Spawn error (make sure ffmpeg is in PATH):", err);
    ffmpegProcess = null;
  });
}

function startRelayServer() {
  try {
    wss = new WebSocketServer({ port: STREAM_PORT, host: "127.0.0.1" });
    console.log(
      `[WebSocket Relay] Server listening at ws://127.0.0.1:${STREAM_PORT}`,
    );

    wss.on("connection", (ws) => {
      console.log("[WebSocket Relay] Client connected");
      startFfmpeg();

      ws.on("close", () => {
        console.log("[WebSocket Relay] Client disconnected");
        if (wss && wss.clients.size === 0) {
          stopFfmpeg();
        }
      });

      ws.on("error", (err) => {
        console.error("[WebSocket Relay] Client socket error:", err);
      });
    });

    wss.on("error", (err) => {
      console.error("[WebSocket Relay Server Error]:", err);
    });
  } catch (err) {
    console.error("Failed to initialize WebSocket server:", err);
  }
}

// Printer Polling Service
interface PrinterStatusResponse {
  state:
    | "PRINTING"
    | "PAUSED"
    | "IDLE"
    | "READY"
    | "BUSY"
    | "STOPPED"
    | "FINISHED"
    | "ATTENTION"
    | "ERROR"
    | "OFFLINE"
    | "CONNECTING";
  stateText: string;
  isConnected: boolean;
  job?: {
    id?: number;
    name?: string;
    progress?: number;
    timeRemaining?: number;
    timePrinting?: number;
    filamentChangeIn?: number;
    filament_change_in?: number;
  };
  telemetry?: {
    tempNozzle?: number;
    targetNozzle?: number;
    tempBed?: number;
    targetBed?: number;
    axisZ?: number;
    speed?: number;
    flow?: number;
  };
  error?: string;
  lastUpdated: number;
}

let latestPrinterStatus: PrinterStatusResponse = {
  state: "CONNECTING",
  stateText: "Connecting...",
  isConnected: false,
  lastUpdated: Date.now(),
};

let printerPollTimer: NodeJS.Timeout | null = null;

async function fetchWithAuth(
  url: string,
  apiKey: string,
  timeoutMs = 2500,
): Promise<any> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (apiKey && apiKey.trim()) {
    const key = apiKey.trim();
    headers["X-Api-Key"] = key;
    // Also provide Basic Auth for PrusaLink maker user
    const base64Auth = Buffer.from(`maker:${key}`).toString("base64");
    headers["Authorization"] = `Basic ${base64Auth}`;
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
    });
    clearTimeout(id);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("401 Unauthorized (Check API Key)");
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (response.status === 204) {
      return null;
    }

    const text = await response.text();
    if (!text || !text.trim()) {
      return null;
    }

    return JSON.parse(text);
  } catch (err: any) {
    clearTimeout(id);
    throw err;
  }
}

async function pollPrinterStatus() {
  if (!printerEnabled || !printerUrl) {
    latestPrinterStatus = {
      state: "OFFLINE",
      stateText: "Disabled",
      isConnected: false,
      lastUpdated: Date.now(),
    };
    sendPrinterStatusUpdate();
    return;
  }

  const baseUrl = printerUrl.replace(/\/+$/, "");

  try {
    // 1. Fetch PrusaLink /api/v1/status
    let statusData: any = null;
    let jobData: any = null;

    try {
      statusData = await fetchWithAuth(
        `${baseUrl}/api/v1/status`,
        printerApiKey,
      );
    } catch (err: any) {
      // If 401 or connection refused, rethrow
      if (err.message?.includes("401")) {
        throw err;
      }
      // Try fallback OctoPrint compatible /api/printer
      try {
        const octoPrinter = await fetchWithAuth(
          `${baseUrl}/api/printer`,
          printerApiKey,
        );
        const octoJob = await fetchWithAuth(
          `${baseUrl}/api/job`,
          printerApiKey,
        ).catch(() => null);

        const isPrinting = octoPrinter?.state?.flags?.printing;
        const isPaused = octoPrinter?.state?.flags?.paused;
        const isReady = octoPrinter?.state?.flags?.ready;
        const stateStr = isPrinting
          ? "PRINTING"
          : isPaused
            ? "PAUSED"
            : isReady
              ? "READY"
              : "IDLE";

        latestPrinterStatus = {
          state: stateStr as any,
          stateText: octoPrinter?.state?.text || stateStr,
          isConnected: true,
          job: octoJob
            ? {
                name: octoJob?.job?.file?.name || octoJob?.job?.file?.display,
                progress:
                  typeof octoJob?.progress?.completion === "number"
                    ? Math.round(octoJob.progress.completion)
                    : undefined,
                timeRemaining: octoJob?.progress?.printTimeLeft,
                timePrinting: octoJob?.progress?.printTime,
              }
            : undefined,
          telemetry: {
            tempNozzle: octoPrinter?.temperature?.tool0?.actual,
            targetNozzle: octoPrinter?.temperature?.tool0?.target,
            tempBed: octoPrinter?.temperature?.bed?.actual,
            targetBed: octoPrinter?.temperature?.bed?.target,
          },
          lastUpdated: Date.now(),
        };
        sendPrinterStatusUpdate();
        return;
      } catch (octoErr) {
        throw err;
      }
    }

    // Try fetching /api/v1/job for extra job details (file name, etc.)
    try {
      jobData = await fetchWithAuth(
        `${baseUrl}/api/v1/job`,
        printerApiKey,
        1500,
      );
    } catch (e) {
      // job endpoint might fail if no active job or not supported
    }

    const p = statusData?.printer || {};
    const j = jobData || statusData?.job || {};

    const rawState = (p.state || "IDLE").toUpperCase();
    let state: PrinterStatusResponse["state"] = "IDLE";
    if (rawState.includes("PRINT")) state = "PRINTING";
    else if (rawState.includes("PAUS")) state = "PAUSED";
    else if (rawState.includes("BUSY")) state = "BUSY";
    else if (rawState.includes("ATTENTION")) state = "ATTENTION";
    else if (rawState.includes("ERROR")) state = "ERROR";
    else if (rawState.includes("FINISH")) state = "FINISHED";
    else if (rawState.includes("STOP")) state = "STOPPED";
    else if (rawState.includes("READY")) state = "READY";
    else state = "IDLE";

    // Calculate progress percentage
    let progress: number | undefined = undefined;
    if (typeof j.progress === "number") {
      progress = Math.round(j.progress);
    } else if (typeof statusData?.job?.progress === "number") {
      progress = Math.round(statusData.job.progress);
    }

    const jobName =
      j.file?.display_name ||
      j.file?.name ||
      statusData?.storage?.name ||
      undefined;

    latestPrinterStatus = {
      state,
      stateText: p.state || state,
      isConnected: true,
      job:
        state === "PRINTING" ||
        state === "PAUSED" ||
        progress !== undefined ||
        jobName
          ? {
              id: j.id || statusData?.job?.id,
              name: jobName,
              progress,
              timeRemaining:
                j.time_remaining ?? statusData?.job?.time_remaining,
              timePrinting: j.time_printing ?? statusData?.job?.time_printing,
              filamentChangeIn:
                typeof j.filament_change_in === "number"
                  ? j.filament_change_in
                  : typeof statusData?.job?.filament_change_in === "number"
                    ? statusData.job.filament_change_in
                    : undefined,
              filament_change_in:
                typeof j.filament_change_in === "number"
                  ? j.filament_change_in
                  : typeof statusData?.job?.filament_change_in === "number"
                    ? statusData.job.filament_change_in
                    : undefined,
            }
          : undefined,
      telemetry: {
        tempNozzle: p.temp_nozzle,
        targetNozzle: p.target_nozzle,
        tempBed: p.temp_bed,
        targetBed: p.target_bed,
        axisZ: p.axis_z,
        speed: p.speed,
        flow: p.flow,
      },
      lastUpdated: Date.now(),
    };
  } catch (err: any) {
    latestPrinterStatus = {
      state: "OFFLINE",
      stateText: err.message || "Offline",
      isConnected: false,
      error: err.message,
      lastUpdated: Date.now(),
    };
  }

  sendPrinterStatusUpdate();
}

let cachedBaseIcon: Electron.NativeImage | null = null;

function getAppIcon(): Electron.NativeImage {
  if (cachedBaseIcon) return cachedBaseIcon;
  const iconPath = path.join(__dirname, "../assets/icon.png");
  const trayIconPath = path.join(__dirname, "../assets/tray-icon.png");
  if (fs.existsSync(iconPath)) {
    cachedBaseIcon = nativeImage.createFromPath(iconPath);
  } else if (fs.existsSync(trayIconPath)) {
    cachedBaseIcon = nativeImage.createFromPath(trayIconPath);
  } else {
    cachedBaseIcon = nativeImage.createFromDataURL(
      `data:image/png;base64,${TRAY_ICON_BASE64}`,
    );
  }
  return cachedBaseIcon;
}

function emitLinuxDbusProgress(progressFraction: number, visible: boolean) {
  if (process.platform !== "linux") return;
  const val = Math.max(0, Math.min(1, progressFraction));
  spawn("busctl", [
    "--user",
    "emit",
    "/com/canonical/unity/launcherentry/printer_dashboard",
    "com.canonical.Unity.LauncherEntry",
    "Update",
    "sa{sv}",
    "application://printer-dashboard.desktop",
    "2",
    "progress-visible",
    "b",
    visible ? "true" : "false",
    "progress",
    "d",
    val.toFixed(4),
  ]).on("error", () => {});
}

function updateTaskbarProgress() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const { state, job } = latestPrinterStatus;
  const progress = typeof job?.progress === "number" ? job.progress : undefined;

  const shouldShow =
    (state === "PRINTING" ||
      state === "PAUSED" ||
      state === "ERROR" ||
      state === "ATTENTION") &&
    progress !== undefined &&
    progress >= 0;

  if (shouldShow) {
    const progressFraction = Math.max(0, Math.min(1, progress / 100));
    const mode =
      state === "PAUSED"
        ? "paused"
        : state === "ERROR" || state === "ATTENTION"
          ? "error"
          : "normal";

    mainWindow.setProgressBar(progressFraction, { mode });
    emitLinuxDbusProgress(progressFraction, true);
  } else {
    mainWindow.setProgressBar(-1);
    emitLinuxDbusProgress(0, false);
  }
}

let prevPrinterState: PrinterStatusResponse["state"] | null = null;

function sendPrinterStatusUpdate() {
  const prevState = prevPrinterState;
  const currState = latestPrinterStatus.state;
  prevPrinterState = currState;

  if (
    prevState &&
    prevState !== "CONNECTING" &&
    prevState !== "OFFLINE" &&
    prevState !== "FINISHED" &&
    currState === "FINISHED"
  ) {
    mainWindow?.webContents.send("printer-status-finished");
  }

  mainWindow?.webContents.send("printer-status-updated", latestPrinterStatus);
  updateTaskbarProgress();
}

function startPrinterPolling() {
  if (printerPollTimer) {
    clearInterval(printerPollTimer);
  }
  pollPrinterStatus();
  printerPollTimer = setInterval(pollPrinterStatus, 1000);
}

function toggleWindow() {
  if (!mainWindow) {
    createWindow();
    return;
  }
  if (mainWindow.isVisible()) {
    if (mainWindow.isFocused()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

function createTray() {
  const iconPath = path.join(__dirname, "../assets/tray-icon.png");
  let icon: Electron.NativeImage;
  if (fs.existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath);
  } else {
    icon = nativeImage.createFromDataURL(
      `data:image/png;base64,${TRAY_ICON_BASE64}`,
    );
  }

  tray = new Tray(icon);
  tray.setToolTip(`Printer Dashboard (${currentRtspUrl})`);

  const updateContextMenu = () => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Toggle Viewer",
        click: () => toggleWindow(),
      },
      {
        label: "Always on Top",
        type: "checkbox",
        checked: isAlwaysOnTop,
        click: (menuItem) => {
          isAlwaysOnTop = menuItem.checked;
          saveConfig({ isAlwaysOnTop });
          mainWindow?.setAlwaysOnTop(isAlwaysOnTop);
          notifyConfigChanged();
        },
      },
      { type: "separator" },
      {
        label: `Camera: ${currentRtspUrl.replace("rtsp://", "")}`,
        enabled: false,
      },
      {
        label: `Printer: ${printerUrl.replace("http://", "").replace("https://", "")}`,
        enabled: false,
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]);
    tray?.setContextMenu(contextMenu);
  };

  updateContextMenu();
  tray.on("click", () => {
    toggleWindow();
  });
}

function notifyConfigChanged() {
  mainWindow?.webContents.send("stream-config-changed", {
    rtspUrl: currentRtspUrl,
    streamPort: STREAM_PORT,
    isAlwaysOnTop,
    printerUrl,
    printerApiKey,
    printerEnabled,
  });
}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const appIcon = getAppIcon();

  mainWindow = new BrowserWindow({
    width: 976,
    height: 477,
    minWidth: 976,
    minHeight: 477,
    x: width - 976,
    y: height,
    icon: appIcon,
    frame: false,
    transparent: true,
    alwaysOnTop: isAlwaysOnTop,
    skipTaskbar: false,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  const isDev = process.env.NODE_ENV === "development";
  const indexPath = path.join(__dirname, "../dist/index.html");

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:5174";
    const loadDev = () => {
      mainWindow?.loadURL(devUrl).catch(() => {
        setTimeout(loadDev, 500);
      });
    };
    loadDev();
  } else if (fs.existsSync(indexPath)) {
    mainWindow.loadFile(indexPath);
  } else {
    mainWindow.loadURL("http://localhost:5174");
  }

  mainWindow.on("maximize", () => {
    mainWindow?.webContents.send("window-maximized-change", true);
  });

  mainWindow.on("unmaximize", () => {
    mainWindow?.webContents.send("window-maximized-change", false);
  });

  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  updateTaskbarProgress();
}

// IPC Handlers
ipcMain.handle("get-config", () => {
  return {
    rtspUrl: currentRtspUrl,
    streamPort: STREAM_PORT,
    isAlwaysOnTop,
    printerUrl,
    printerApiKey,
    printerEnabled,
  };
});

ipcMain.handle("get-printer-status", () => {
  return latestPrinterStatus;
});

ipcMain.handle("is-maximized", () => {
  return mainWindow?.isMaximized() ?? false;
});

ipcMain.handle("toggle-maximize", () => {
  if (!mainWindow) return false;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    return false;
  } else {
    mainWindow.maximize();
    return true;
  }
});

ipcMain.handle("set-rtsp-url", (_event, newUrl: string) => {
  if (newUrl && newUrl.trim()) {
    currentRtspUrl = newUrl.trim();
    saveConfig({ rtspUrl: currentRtspUrl });
    tray?.setToolTip(`Printer Dashboard (${currentRtspUrl})`);
    notifyConfigChanged();
    if (wss && wss.clients.size > 0) {
      startFfmpeg();
    }
    return true;
  }
  return false;
});

ipcMain.handle(
  "set-printer-config",
  (
    _event,
    config: {
      printerUrl?: string;
      printerApiKey?: string;
      printerEnabled?: boolean;
    },
  ) => {
    if (config.printerUrl !== undefined) {
      printerUrl = config.printerUrl.trim();
    }
    if (config.printerApiKey !== undefined) {
      printerApiKey = config.printerApiKey.trim();
    }
    if (config.printerEnabled !== undefined) {
      printerEnabled = config.printerEnabled;
    }

    saveConfig({
      printerUrl,
      printerApiKey,
      printerEnabled,
    });

    notifyConfigChanged();
    pollPrinterStatus();
    return true;
  },
);

ipcMain.handle("toggle-always-on-top", () => {
  isAlwaysOnTop = !isAlwaysOnTop;
  saveConfig({ isAlwaysOnTop });
  mainWindow?.setAlwaysOnTop(isAlwaysOnTop);
  notifyConfigChanged();
  return isAlwaysOnTop;
});

ipcMain.handle("is-always-on-top", () => {
  return isAlwaysOnTop;
});

ipcMain.handle("minimize-window", () => {
  mainWindow?.minimize();
});

ipcMain.handle("close-window", () => {
  mainWindow?.hide();
});

ipcMain.handle("save-snapshot", async (_event, dataUrl: string) => {
  try {
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const defaultFilename = `printer-snapshot-${timestamp}.png`;

    const picturesDir =
      app.getPath("pictures") ||
      app.getPath("downloads") ||
      app.getPath("userData");
    const targetPath = path.join(picturesDir, defaultFilename);

    fs.writeFileSync(targetPath, buffer);

    if (Notification.isSupported()) {
      new Notification({
        title: "Snapshot Saved",
        body: `Saved to ${targetPath}`,
        silent: false,
      }).show();
    }

    return { success: true, filePath: targetPath };
  } catch (err: any) {
    console.error("Failed to save snapshot:", err);
    return { success: false, error: err.message };
  }
});

// App Lifecycle
app.name = "Printer Dashboard";
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
app.whenReady().then(() => {
  startRelayServer();
  createTray();
  createWindow();
  startPrinterPolling();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", () => {
  isQuitting = true;
  if (printerPollTimer) {
    clearInterval(printerPollTimer);
    printerPollTimer = null;
  }
  stopFfmpeg();
  if (wss) {
    wss.close();
  }
});

app.on("window-all-closed", () => {
  if (isQuitting || process.platform === "darwin") {
    app.quit();
  }
});
