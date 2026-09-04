import React, { useEffect, useRef } from "react";
import { useStreamStore } from "../store/useStreamStore";
import { Loader2, VideoOff } from "lucide-react";

interface VideoPlayerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ canvasRef }) => {
  const { streamPort, status, setStatus, aspectRatio, rtspUrl, printerData } =
    useStreamStore();
  const playerRef = useRef<any>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Only consider offline if printerData has explicitly arrived and reports OFFLINE
  const isPrinterOffline =
    printerData !== null && printerData.state === "OFFLINE";

  const clearCanvas = () => {
    if (canvasRef.current) {
      try {
        const ctx = canvasRef.current.getContext("2d");
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
      setStatus("disconnected");
      return;
    }

    if (!canvasRef.current || !window.JSMpeg) {
      scheduleReconnect(500);
      return;
    }

    destroyPlayer();
    setStatus("connecting");

    const wsUrl = `ws://127.0.0.1:${streamPort}`;

    try {
      playerRef.current = new window.JSMpeg.Player(wsUrl, {
        canvas: canvasRef.current,
        autoplay: true,
        audio: false,
        pauseWhenHidden: false,
        videoBufferSize: 4 * 1024 * 1024,
        onVideoDecode: () => {
          if (isMountedRef.current) {
            setStatus("live");
          }
        },
        onSourceEstablished: () => {
          // Connected to websocket relay
        },
        onSourceCompleted: () => {
          if (isMountedRef.current) {
            setStatus("disconnected");
            clearCanvas();
            scheduleReconnect(2000);
          }
        },
      });
    } catch (err) {
      console.error("Failed to instantiate JSMpeg player:", err);
      if (isMountedRef.current) {
        setStatus("error");
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

  // React to printer coming online or going offline
  useEffect(() => {
    if (isPrinterOffline) {
      clearReconnectTimer();
      destroyPlayer();
      clearCanvas();
      setStatus("disconnected");
    } else {
      if (status === "disconnected" || status === "error") {
        initStream();
      }
    }
  }, [isPrinterOffline]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {/* Canvas stays permanently mounted with valid size, but opacity-0 when not live to prevent frozen frame */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full transition-opacity duration-200 ${
          status === "live" && !isPrinterOffline ? "opacity-100" : "opacity-0"
        } ${aspectRatio === "contain" ? "object-contain" : "object-cover"}`}
      />

      {/* Offline Overlay */}
      {isPrinterOffline && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-2 text-slate-500 select-none pointer-events-none">
          <VideoOff className="text-slate-600" size={32} />
          <p className="text-xs font-medium text-slate-400">
            Printer is offline
          </p>
        </div>
      )}

      {/* Connecting Overlay */}
      {!isPrinterOffline && status === "connecting" && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-2 text-slate-300 select-none pointer-events-none">
          <Loader2 className="animate-spin text-sky-400" size={26} />
          <p className="text-xs font-medium text-slate-400">
            Connecting stream...
          </p>
        </div>
      )}

      {/* Reconnecting Overlay */}
      {!isPrinterOffline && (status === "disconnected" || status === "error") && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-2 text-slate-300 select-none pointer-events-none">
          <Loader2 className="animate-spin text-sky-400" size={26} />
          <p className="text-xs font-medium text-slate-300">
            Reconnecting stream...
          </p>
        </div>
      )}
    </div>
  );
};
