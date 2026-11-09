/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Minimize2,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Plus,
  Volume2,
  VolumeX,
  Flame,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { soundEngine } from '../../services/audio';

interface FullscreenTimerProps {
  onExit: () => void;
}

export const FullscreenTimer: React.FC<FullscreenTimerProps> = ({ onExit }) => {
  const {
    timer,
    activeProject,
    streakInfo,
    settings,
    updateSettings,
    pauseTimer,
    resumeTimer,
    stopTimer,
    skipBreak,
    addExtraMinutes,
    resetTimer,
  } = useApp();

  const minutes = Math.floor(timer.remainingSeconds / 60);
  const seconds = timer.remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progress = timer.totalDurationSeconds > 0
    ? (1 - timer.remainingSeconds / timer.totalDurationSeconds) * 100
    : 0;

  const circumference = 2 * Math.PI * 135;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const isBreak = timer.sessionType !== 'focus';

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between p-6 sm:p-12 select-none overflow-hidden animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-4xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">
            {isBreak
              ? timer.sessionType === 'long_break' ? 'Long Break' : 'Rest Break'
              : 'Deep Focus Session'}
          </span>
          {activeProject && (
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-medium">
              {activeProject.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Sound Mute Toggle */}
          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors"
            title={settings.soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-zinc-500" />}
          </button>

          {/* Exit Fullscreen */}
          <button
            onClick={onExit}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold tracking-wide border border-zinc-800 transition-colors"
          >
            <Minimize2 className="w-4 h-4" />
            <span className="hidden sm:inline">Exit Fullscreen</span>
          </button>
        </div>
      </div>

      {/* Main Focus Ring & Digits */}
      <div className="relative flex flex-col items-center justify-center my-auto">
        <div className="relative w-72 h-72 sm:w-88 sm:h-88 flex items-center justify-center">
          {/* Circular SVG Ring */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 300 300">
            {/* Background Track */}
            <circle
              cx="150"
              cy="150"
              r="135"
              fill="none"
              stroke="#18181b"
              strokeWidth="10"
            />
            {/* Active Progress */}
            <circle
              cx="150"
              cy="150"
              r="135"
              fill="none"
              stroke={isBreak ? '#10b981' : '#ffffff'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Center Digital Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono text-6xl sm:text-7xl font-bold tracking-tighter text-white drop-shadow-lg">
              {formattedTime}
            </span>
            <span className="text-xs uppercase tracking-widest text-zinc-400 mt-2 font-medium">
              {isBreak ? 'Recharge your mind' : 'Stay immersed'}
            </span>
          </div>
        </div>

        {/* Ambient Sound Indicator */}
        {settings.ambientSound !== 'none' && !isBreak && (
          <div className="mt-6 flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/60 px-3 py-1.5 rounded-full border border-zinc-800/60">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Ambient: {settings.ambientSound.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="max-w-md w-full mx-auto flex flex-col items-center gap-4">
        <div className="flex items-center justify-center gap-4">
          {/* Add 5 min */}
          <button
            onClick={() => addExtraMinutes(5)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 transition-all active:scale-95"
            title="Add 5 minutes"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>5m</span>
          </button>

          {/* Play/Pause Main Button */}
          {timer.isPaused ? (
            <button
              onClick={resumeTimer}
              className="w-16 h-16 rounded-full bg-white text-zinc-950 flex items-center justify-center hover:bg-zinc-200 transition-all active:scale-95 shadow-xl"
            >
              <Play className="w-7 h-7 fill-zinc-950 ml-1" />
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-700 text-white flex items-center justify-center hover:bg-zinc-800 transition-all active:scale-95 shadow-xl"
            >
              <Pause className="w-7 h-7 fill-white" />
            </button>
          )}

          {/* Skip Break (when in break) or Stop/Finish */}
          {isBreak ? (
            <button
              onClick={skipBreak}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-emerald-400 text-xs font-semibold border border-zinc-800 transition-all active:scale-95"
              title="Skip break and focus"
            >
              <SkipForward className="w-4 h-4" />
              <span>Skip</span>
            </button>
          ) : (
            <button
              onClick={() => stopTimer(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 text-xs font-semibold border border-zinc-800 transition-all active:scale-95"
              title="End session & record focus"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Finish</span>
            </button>
          )}
        </div>

        {/* Motivational footer quote */}
        <p className="text-[11px] text-zinc-400 tracking-wider font-light">
          "Every Minute Builds a Better You."
        </p>
      </div>
    </div>
  );
};
