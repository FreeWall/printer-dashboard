import React, { useEffect, useRef } from 'react';
import { useStreamStore } from '../store/useStreamStore';
import { Loader2, VideoOff } from 'lucide-react';

interface VideoPlayerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onReconnect: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ canvasRef, onReconnect }) => {
  const { streamPort, status, setStatus, aspectRatio, rtspUrl } = useStreamStore();
  const playerRef = useRef<any>(null);

  const initStream = () => {
    if (!canvasRef.current || !window.JSMpeg) {
      console.warn('Canvas or JSMpeg not ready yet');
      return;
    }

    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        // ignore
      }
      playerRef.current = null;
    }

    setStatus('connecting');

    const wsUrl = `ws://127.0.0.1:${streamPort}`;

    try {
      playerRef.current = new window.JSMpeg.Player(wsUrl, {
        canvas: canvasRef.current,
        autoplay: true,
        audio: false,
        pauseWhenHidden: false,
        videoBufferSize: 4 * 1024 * 1024,
        onVideoDecode: () => {
          setStatus('live');
        },
        onSourceEstablished: () => {
          // Connected to websocket
        },
        onSourceCompleted: () => {
          setStatus('disconnected');
        },
      });
    } catch (err) {
      console.error('Failed to instantiate JSMpeg player:', err);
      setStatus('error');
    }
  };

  useEffect(() => {
    initStream();
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, [streamPort, rtspUrl]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        className={`w-full h-full transition-all duration-200 ${
          aspectRatio === 'contain' ? 'object-contain' : 'object-cover'
        }`}
      />

      {status === 'connecting' && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-slate-300 pointer-events-none">
          <Loader2 className="animate-spin text-sky-400" size={32} />
          <p className="text-sm font-medium">Connecting to stream...</p>
          <span className="text-xs font-mono text-slate-400">{rtspUrl}</span>
        </div>
      )}

      {(status === 'disconnected' || status === 'error') && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-slate-300">
          <VideoOff className="text-rose-400" size={36} />
          <div className="text-center">
            <p className="text-sm font-semibold text-rose-300">Stream Disconnected</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">{rtspUrl}</p>
          </div>
          <button
            onClick={() => {
              initStream();
              onReconnect();
            }}
            className="mt-2 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold rounded-md shadow transition"
          >
            Retry Connection
          </button>
        </div>
      )}
    </div>
  );
};
