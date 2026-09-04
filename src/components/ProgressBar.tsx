import React from "react";
import { useStreamStore } from "../store/useStreamStore";

export const ProgressBar: React.FC = () => {
  const { printerData, printerEnabled } = useStreamStore();

  if (!printerEnabled || !printerData) return null;

  const state = printerData.state;
  const progress = printerData.job?.progress;

  const hasProgress = progress !== undefined && progress !== null;
  const isActive =
    state === "PRINTING" ||
    state === "PAUSED" ||
    state === "FINISHED" ||
    (hasProgress && progress > 0);

  if (!isActive || !hasProgress) return null;

  const clampedProgress = Math.min(100, Math.max(0, progress));

  const getBarStyle = () => {
    if (state === "FINISHED") {
      return "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]";
    }
    if (state === "PAUSED") {
      return "bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]";
    }
    return "bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 shadow-[0_0_12px_rgba(56,189,248,0.7)]";
  };

  return (
    <div
      className="absolute top-0 left-0 right-0 z-20 h-1.5 bg-black/50 backdrop-blur-xs overflow-hidden pointer-events-none"
      title={`Print Progress: ${clampedProgress.toFixed(1)}%`}
    >
      <div
        className={`h-full rounded-r-full transition-all duration-300 ${getBarStyle()}`}
        style={{ width: `${clampedProgress}%` }}
      />
    </div>
  );
};
