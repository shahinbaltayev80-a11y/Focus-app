/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Plus,
  Maximize2,
  Sliders,
  Volume2,
  VolumeX,
  Flame,
  CheckCircle2,
  Folder,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TimerMode, AmbientSoundType } from '../../types';
import { FullscreenTimer } from './FullscreenTimer';

export const TimerView: React.FC = () => {
  const {
    timer,
    setTimerMode,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    skipBreak,
    addExtraMinutes,
    resetTimer,
    projects,
    activeProject,
    setActiveProjectId,
    settings,
    updateSettings,
    streakInfo,
  } = useApp();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);

  // Time calculations
  const minutes = Math.floor(timer.remainingSeconds / 60);
  const seconds = timer.remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progress = timer.totalDurationSeconds > 0
    ? (1 - timer.remainingSeconds / timer.totalDurationSeconds) * 100
    : 0;

  const isBreak = timer.sessionType !== 'focus';
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const activeProjectsList = projects.filter(p => !p.isArchived);

  // Ambient sound options
  const soundOptions: { id: AmbientSoundType; label: string; icon: string }[] = [
    { id: 'none', label: 'Silent', icon: '🔇' },
    { id: 'rain', label: 'Rainfall', icon: '🌧️' },
    { id: 'forest', label: 'Deep Forest', icon: '🌲' },
    { id: 'birds', label: 'Gentle Birds', icon: '🐦' },
    { id: 'whitenoise', label: 'White Noise', icon: '💨' },
    { id: 'clock', label: 'Clock Ticking', icon: '🕰️' },
    { id: 'fireplace', label: 'Fireplace', icon: '🔥' },
    { id: 'library', label: 'Library Ambience', icon: '📚' },
  ];

  if (isFullscreen) {
    return <FullscreenTimer onExit={() => setIsFullscreen(false)} />;
  }

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto px-4 py-4 sm:py-6 pb-24 sm:pb-12 space-y-6">
      {/* 1. Mode Selector Tabs */}
      <div className="w-full flex items-center justify-between gap-2 p-1.5 bg-zinc-900/90 rounded-2xl border border-zinc-800">
        {(['pomodoro', 'custom', 'super'] as TimerMode[]).map((mode) => {
          const isSelected = timer.mode === mode;
          const labels = {
            pomodoro: 'Pomodoro',
            custom: 'Custom Mode',
            super: 'Super Mode',
          };
          const badges = {
            pomodoro: `${settings.pomoFocusMin}/${settings.pomoShortBreakMin}m`,
            custom: `${settings.customFocusMin}/${settings.customBreakMin}m`,
            super: `${Math.floor(settings.superFocusMin / 60)}h+`,
          };

          return (
            <button
              key={mode}
              onClick={() => {
                if (!timer.isActive) {
                  setTimerMode(mode);
                }
              }}
              disabled={timer.isActive}
              className={`flex-1 py-2 px-3 rounded-xl flex flex-col items-center justify-center transition-all ${
                isSelected
                  ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 disabled:opacity-60'
              }`}
            >
              <span className="text-xs tracking-tight">{labels[mode]}</span>
              <span className="text-[10px] text-zinc-500 font-mono mt-0.5">{badges[mode]}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Project Picker Dropdown */}
      <div className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-xs">
        <div className="flex items-center gap-2 text-zinc-400">
          <Folder className="w-4 h-4 text-zinc-400" />
          <span className="font-medium text-zinc-300">Active Project:</span>
        </div>

        <select
          value={activeProject?.id || ''}
          onChange={(e) => setActiveProjectId(e.target.value || undefined)}
          disabled={timer.isActive}
          className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-75"
        >
          <option value="">General Focus (No Project)</option>
          {activeProjectsList.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} {p.isBookProject ? '📖' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Main Circular Timer Graphic & Digits */}
      <div className="relative flex flex-col items-center justify-center my-2">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          {/* SVG Progress Ring */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 280 280">
            {/* Background Track */}
            <circle
              cx="140"
              cy="140"
              r="120"
              fill="none"
              stroke="#27272a"
              strokeWidth="10"
            />
            {/* Animated Progress Arc */}
            <circle
              cx="140"
              cy="140"
              r="120"
              fill="none"
              stroke={isBreak ? '#10b981' : '#ffffff'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-linear"
            />
          </svg>

          {/* Center Digital Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            {/* Session Type Pill */}
            <div className="mb-2">
              <span
                className={`text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border ${
                  isBreak
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : timer.isPaused
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                }`}
              >
                {timer.isActive && timer.isPaused
                  ? 'PAUSED'
                  : isBreak
                  ? timer.sessionType === 'long_break' ? 'LONG BREAK' : 'SHORT BREAK'
                  : 'FOCUS TIME'}
              </span>
            </div>

            {/* Digits */}
            <span className="font-mono text-5xl sm:text-6xl font-extrabold tracking-tighter text-white">
              {formattedTime}
            </span>

            {/* Sub-label */}
            <div className="mt-2 text-xs text-zinc-400 font-medium truncate max-w-[200px]">
              {activeProject ? activeProject.name : 'Unassigned'}
            </div>

            {/* Pomodoro cycle count indicator */}
            {timer.mode === 'pomodoro' && (
              <div className="flex items-center gap-1.5 mt-2">
                {[1, 2, 3, 4].map(idx => (
                  <span
                    key={idx}
                    className={`w-2 h-2 rounded-full ${
                      idx <= timer.cycleCount ? 'bg-white' : 'bg-zinc-800'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Qualification Status for Today's Streak */}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
          <Flame className={`w-4 h-4 ${streakInfo.isQualifiedToday ? 'text-amber-400' : 'text-zinc-500'}`} />
          <span>
            {streakInfo.isQualifiedToday
              ? "Today's 15m streak qualification completed!"
              : `${streakInfo.todayMinutes} / 15 min focused today for daily streak`}
          </span>
        </div>
      </div>

      {/* 4. Main Timer Control Buttons */}
      <div className="w-full flex items-center justify-center gap-3">
        {!timer.isActive ? (
          <button
            onClick={() => startTimer()}
            className="w-full max-w-xs py-3.5 px-6 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm tracking-wide shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-zinc-950" />
            <span>START FOCUS</span>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            {/* Add Extra 5 Minutes */}
            <button
              onClick={() => addExtraMinutes(5)}
              className="p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-all active:scale-95 flex items-center gap-1 text-xs font-semibold"
              title="Add 5 extra minutes"
            >
              <Plus className="w-4 h-4" />
              <span>5m</span>
            </button>

            {/* Play / Pause Toggle */}
            {timer.isPaused ? (
              <button
                onClick={resumeTimer}
                className="w-14 h-14 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 flex items-center justify-center active:scale-95 transition-all shadow-md"
                title="Resume session"
              >
                <Play className="w-6 h-6 fill-zinc-950 ml-0.5" />
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="w-14 h-14 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white flex items-center justify-center active:scale-95 transition-all shadow-md"
                title="Pause session (paused time is excluded from focus)"
              >
                <Pause className="w-6 h-6 fill-white" />
              </button>
            )}

            {/* Skip Break (during break) OR Finish/Stop */}
            {isBreak ? (
              <button
                onClick={skipBreak}
                className="p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-800 transition-all active:scale-95 flex items-center gap-1 text-xs font-semibold"
                title="Skip break and start next focus"
              >
                <SkipForward className="w-4 h-4" />
                <span>Skip</span>
              </button>
            ) : (
              <button
                onClick={() => stopTimer(true)}
                className="p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-800 transition-all active:scale-95 flex items-center gap-1 text-xs font-semibold"
                title="Finish & save recorded focus"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finish</span>
              </button>
            )}

            {/* Reset / Cancel session */}
            <button
              onClick={resetTimer}
              className="p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 border border-zinc-800 transition-all active:scale-95"
              title="Reset timer without saving"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 5. Utility Bar: Ambient Sounds, Duration Settings, Fullscreen */}
      <div className="w-full flex items-center justify-around p-3 bg-zinc-900/60 rounded-2xl border border-zinc-800/60 text-xs">
        {/* Ambient Sound Trigger */}
        <button
          onClick={() => setShowAudioModal(true)}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
        >
          {settings.soundEnabled && settings.ambientSound !== 'none' ? (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-zinc-500" />
          )}
          <span>
            {settings.ambientSound === 'none' ? 'Ambience: Off' : settings.ambientSound}
          </span>
        </button>

        <div className="w-px h-4 bg-zinc-800" />

        {/* Duration Settings Drawer Trigger */}
        <button
          onClick={() => setShowConfigModal(true)}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
        >
          <Sliders className="w-4 h-4" />
          <span>Timer Config</span>
        </button>

        <div className="w-px h-4 bg-zinc-800" />

        {/* Fullscreen Trigger */}
        <button
          onClick={() => setIsFullscreen(true)}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
          <span>Zen Mode</span>
        </button>
      </div>

      {/* Audio Settings Modal */}
      {showAudioModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-zinc-400" />
                <span>Ambient Audio & Sounds</span>
              </h3>
              <button
                onClick={() => setShowAudioModal(false)}
                className="text-zinc-500 hover:text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>

            {/* Mute master toggle */}
            <div className="flex items-center justify-between p-3 bg-zinc-800/60 rounded-xl">
              <div>
                <p className="text-sm font-medium text-white">Audio Alerts & Ambience</p>
                <p className="text-xs text-zinc-400">Play background sound and chime bells</p>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                className="w-5 h-5 accent-white rounded cursor-pointer"
              />
            </div>

            {/* Ambient Sound Selection Grid */}
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                Focus Background Sound
              </label>
              <div className="grid grid-cols-2 gap-2">
                {soundOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => updateSettings({ ambientSound: opt.id })}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                      settings.ambientSound === opt.id
                        ? 'bg-zinc-100 text-zinc-950 border-white'
                        : 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60 hover:bg-zinc-800'
                    }`}
                  >
                    <span className="text-base">{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Volume Slider */}
            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                <span>Ambient Volume</span>
                <span>{Math.round(settings.ambientVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.ambientVolume}
                onChange={(e) => updateSettings({ ambientVolume: parseFloat(e.target.value) })}
                className="w-full accent-white h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
              />
            </div>

            <button
              onClick={() => setShowAudioModal(false)}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-colors"
            >
              Apply Sounds
            </button>
          </div>
        </div>
      )}

      {/* Timer Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-zinc-400" />
                <span>Timer Customization</span>
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-zinc-500 hover:text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>

            {/* Pomodoro Settings */}
            <div className="space-y-3 p-3 bg-zinc-800/40 rounded-2xl border border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                Pomodoro Mode
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1">Focus (min)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={settings.pomoFocusMin}
                    onChange={(e) => updateSettings({ pomoFocusMin: Math.max(1, parseInt(e.target.value) || 25) })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Short Break (min)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.pomoShortBreakMin}
                    onChange={(e) => updateSettings({ pomoShortBreakMin: Math.max(1, parseInt(e.target.value) || 5) })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Long Break (min)</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={settings.pomoLongBreakMin}
                    onChange={(e) => updateSettings({ pomoLongBreakMin: Math.max(1, parseInt(e.target.value) || 15) })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Cycles before Long Break</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.pomoSessionsBeforeLongBreak}
                    onChange={(e) => updateSettings({ pomoSessionsBeforeLongBreak: Math.max(1, parseInt(e.target.value) || 4) })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Custom Mode Settings */}
            <div className="space-y-3 p-3 bg-zinc-800/40 rounded-2xl border border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                Custom Mode
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1">Study Duration (min)</label>
                  <input
                    type="number"
                    min="5"
                    max="240"
                    value={settings.customFocusMin}
                    onChange={(e) => updateSettings({ customFocusMin: Math.max(5, parseInt(e.target.value) || 45) })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Break Duration (min)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.customBreakMin}
                    onChange={(e) => updateSettings({ customBreakMin: Math.max(1, parseInt(e.target.value) || 10) })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-zinc-300">Auto-start next session</span>
                <input
                  type="checkbox"
                  checked={settings.customAutoTransition}
                  onChange={(e) => updateSettings({ customAutoTransition: e.target.checked })}
                  className="w-4 h-4 accent-white rounded"
                />
              </div>
            </div>

            {/* Super Mode Settings */}
            <div className="space-y-3 p-3 bg-zinc-800/40 rounded-2xl border border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Super Mode (Extended Deep Work)</span>
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1">Focus Time (min)</label>
                  <input
                    type="number"
                    min="60"
                    max="600"
                    step="15"
                    value={settings.superFocusMin}
                    onChange={(e) => updateSettings({ superFocusMin: Math.max(60, parseInt(e.target.value) || 180) })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Rest Break (min)</label>
                  <input
                    type="number"
                    min="5"
                    max="90"
                    value={settings.superBreakMin}
                    onChange={(e) => updateSettings({ superBreakMin: Math.max(5, parseInt(e.target.value) || 25) })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowConfigModal(false);
                if (!timer.isActive) {
                  setTimerMode(timer.mode);
                }
              }}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
