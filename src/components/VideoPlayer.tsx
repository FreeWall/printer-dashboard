import React, { useEffect, useRef } from 'react';
import { useStreamStore } from '../store/useStreamStore';
import { Loader2, VideoOff } from 'lucide-react';

interface VideoPlayerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ canvasRef }) => {
  const streamPort = useStreamStore((s) => s.streamPort);
  const status = useStreamStore((s) => s.status);
  const setStatus = useStreamStore((s) => s.setStatus);
  const aspectRatio = useStreamStore((s) => s.aspectRatio);
  const rtspUrl = useStreamStore((s) => s.rtspUrl);
  const isPrinterOffline = useStreamStore(
    (s) => s.printerData !== null && s.printerData.state === 'OFFLINE',
  );
  const isPrinterOnline = useStreamStore(
    (s) =>
      s.printerData !== null &&
      s.printerData.isConnected &&
      s.printerData.state !== 'OFFLINE' &&
      s.printerData.state !== 'CONNECTING',
  );

  const playerRef = useRef<any>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const lastFrameTimeRef = useRef<number>(0);
  const connectingStartTimeRef = useRef<number>(0);

  const prevPrinterOnlineRef = useRef<boolean>(false);
  const prevPrinterOfflineRef = useRef<boolean>(isPrinterOffline);

  const clearCanvas = () => {
    if (canvasRef.current) {
      try {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      } catch (e) {
        // ignore
      }
    }
  };

  const clearReconnectTimer = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  };

  const destroyPlayer = () => {
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        // ignore
      }
      playerRef.current = null;
    }
  };

  const scheduleReconnect = (delayMs = 2000) => {
    clearReconnectTimer();
    if (isPrinterOffline || !isMountedRef.current) return;

    reconnectTimerRef.current = setTimeout(() => {
      if (isMountedRef.current && !isPrinterOffline) {
        initStream();
      }
    }, delayMs);
  };

  const initStream = () => {
    clearReconnectTimer();

    if (isPrinterOffline) {
      destroyPlayer();
      clearCanvas();
      setStatus('disconnected');
      return;
    }

    if (!canvasRef.current || !window.JSMpeg) {
      scheduleReconnect(500);
      return;
    }

    destroyPlayer();
    setStatus('connecting');
    connectingStartTimeRef.current = Date.now();

    const wsUrl = `ws://127.0.0.1:${streamPort}`;

    try {
      playerRef.current = new window.JSMpeg.Player(wsUrl, {
        canvas: canvasRef.current,
        autoplay: true,
        audio: false,
        pauseWhenHidden: false,
        videoBufferSize: 1024 * 1024,
        onVideoDecode: () => {
          if (isMountedRef.current) {
            lastFrameTimeRef.current = Date.now();
            if (useStreamStore.getState().status !== 'live') {
              setStatus('live');
            }
          }
        },
        onSourceEstablished: () => {
          // Connected to websocket relay
        },
        onSourceCompleted: () => {
          if (isMountedRef.current) {
            setStatus('disconnected');
            clearCanvas();
            scheduleReconnect(2000);
          }
        },
      });
    } catch (err) {
      console.error('Failed to instantiate JSMpeg player:', err);
      if (isMountedRef.current) {
        setStatus('error');
        clearCanvas();
        scheduleReconnect(2500);
      }
    }
  };

  // Mount effect: start stream immediately
  useEffect(() => {
    isMountedRef.current = true;
    initStream();

    return () => {
      isMountedRef.current = false;
      clearReconnectTimer();
      destroyPlayer();
      clearCanvas();
    };
  }, [streamPort, rtspUrl]);

  // Watchdog: detect stalled connecting or lost live stream
  useEffect(() => {
    const watchdogInterval = setInterval(() => {
      if (!isMountedRef.current || isPrinterOffline) return;

      const now = Date.now();
      if (status === 'live') {
        if (lastFrameTimeRef.current && now - lastFrameTimeRef.current > 4000) {
          clearCanvas();
          setStatus('disconnected');
          scheduleReconnect(1000);
        }
      } else if (status === 'connecting') {
        if (connectingStartTimeRef.current && now - connectingStartTimeRef.current > 6000) {
          destroyPlayer();
          setStatus('disconnected');
          scheduleReconnect(1500);
        }
      }
    }, 1000);

    return () => clearInterval(watchdogInterval);
  }, [status, isPrinterOffline]);

  // React to printer coming online or going offline
  useEffect(() => {
    const wasOnline = prevPrinterOnlineRef.current;
    const wasOffline = prevPrinterOfflineRef.current;
    prevPrinterOnlineRef.current = isPrinterOnline;
    prevPrinterOfflineRef.current = isPrinterOffline;

    if (isPrinterOffline) {
      clearReconnectTimer();
      destroyPlayer();
      clearCanvas();
      setStatus('disconnected');
    } else if (isPrinterOnline && (wasOffline || !wasOnline)) {
      if (useStreamStore.getState().status !== 'live') {
        initStream();
      }
    }
  }, [isPrinterOffline, isPrinterOnline]);

  return (
    <div className="relative flex h-full w-full items-center justify-end overflow-hidden bg-black">
      {/* Canvas stays permanently mounted with valid size, but opacity-0 when not live to prevent frozen frame */}
      <canvas
        ref={canvasRef}
        className={`h-full w-full object-right transition-opacity duration-200 ${
          status === 'live' && !isPrinterOffline ? 'opacity-100' : 'opacity-0'
        } ${aspectRatio === 'contain' ? 'object-contain' : 'object-cover'}`}
      />

      {/* Offline Overlay */}
      {isPrinterOffline && (
        <div className="pointer-events-none absolute inset-0 flex select-none flex-col items-center justify-center gap-2 bg-black text-slate-500">
          <VideoOff
            className="text-slate-600"
            size={32}
          />
          <p className="text-xs font-medium text-slate-400">Printer is offline</p>
        </div>
      )}

      {/* Connecting Overlay */}
      {!isPrinterOffline && status === 'connecting' && (
        <div className="pointer-events-none absolute inset-0 flex select-none flex-col items-center justify-center gap-2 bg-black text-slate-300">
          <Loader2
            className="animate-spin text-sky-400"
            size={26}
          />
          <p className="text-xs font-medium text-slate-400">Connecting stream...</p>
        </div>
      )}

      {/* Reconnecting Overlay */}
      {!isPrinterOffline && (status === 'disconnected' || status === 'error') && (
        <div className="pointer-events-none absolute inset-0 flex select-none flex-col items-center justify-center gap-2 bg-black text-slate-300">
          <Loader2
            className="animate-spin text-sky-400"
            size={26}
          />
          <p className="text-xs font-medium text-slate-300">Reconnecting stream...</p>
        </div>
      )}
    </div>
  );
};
