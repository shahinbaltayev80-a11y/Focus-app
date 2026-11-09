/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Flame, Moon, Sun, Database, Shield, Users, Sparkles, AlertCircle, Download } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface HeaderProps {
  onOpenProfileSwitcher: () => void;
  onOpenBackupModal: () => void;
  onOpenInstallModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenProfileSwitcher,
  onOpenBackupModal,
  onOpenInstallModal,
}) => {
  const { isInstalled } = usePWAInstall();
  const {
    activeProfile,
    streakInfo,
    theme,
    setTheme,
    hasDemoData,
    clearDemoData,
  } = useApp();

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-zinc-950/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img
            src="/favicon.svg"
            alt="FOCUS"
            className="w-8 h-8 rounded-xl shadow-md border border-indigo-500/30 select-none object-cover"
          />
          <div>
            <h1 className="text-base font-extrabold tracking-wider text-white">FOCUS</h1>
            <p className="hidden md:block text-[10px] text-zinc-400 font-medium tracking-tight">
              Every Minute Builds a Better You
            </p>
          </div>
        </div>

        {/* Right tools: Streak, Profile Switcher, Backup, Theme */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Demo Data Notice */}
          {hasDemoData && (
            <div className="relative">
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs hover:bg-amber-500/20 transition-colors"
                title="Click to remove demo data"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Demo Active</span>
                <span className="text-[10px] underline ml-1">Clear</span>
              </button>

              {showClearConfirm && (
                <div className="absolute right-0 top-full mt-2 w-56 p-3 rounded-xl bg-zinc-900 border border-zinc-700 shadow-xl z-50 text-xs">
                  <p className="text-zinc-200 mb-2">Remove all demo sessions and restore clean state?</p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-2 py-1 text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        await clearDemoData();
                        setShowClearConfirm(false);
                      }}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-md font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Streak Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
              streakInfo.isQualifiedToday
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-sm shadow-amber-500/10'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}
            title={
              streakInfo.isQualifiedToday
                ? `Today's 15m qualifying goal reached! Current streak: ${streakInfo.currentStreak} days.`
                : `${streakInfo.todayMinutes}/15 min focused today to keep streak active.`
            }
          >
            <Flame className={`w-3.5 h-3.5 ${streakInfo.isQualifiedToday ? 'text-amber-400 fill-amber-400' : 'text-zinc-500'}`} />
            <span>{streakInfo.currentStreak}d</span>
            {!streakInfo.isQualifiedToday && (
              <span className="text-[10px] text-zinc-500 hidden sm:inline">({streakInfo.todayMinutes}/15m)</span>
            )}
          </div>

          {/* Install PWA Button (Hidden when running in standalone mode) */}
          {!isInstalled && onOpenInstallModal && (
            <button
              onClick={onOpenInstallModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-400 hover:text-amber-300 border border-amber-500/30 transition-all text-xs font-semibold shadow-sm"
              title="Install FOCUS app on your device"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install</span>
            </button>
          )}

          {/* Backup & Cloud Storage */}
          <button
            onClick={onOpenBackupModal}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80 transition-colors"
            title="Data Backup & Storage Settings"
          >
            <Database className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Profile Switcher Button */}
          <button
            onClick={onOpenProfileSwitcher}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-all text-xs font-medium text-zinc-200"
            title="Switch or manage profiles"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-500 flex items-center justify-center text-white text-[11px] font-bold uppercase overflow-hidden">
              {activeProfile?.name?.charAt(0) || 'P'}
            </div>
            <span className="max-w-[80px] sm:max-w-[110px] truncate">{activeProfile?.name}</span>
            {activeProfile?.pinHash && (
              <span title="PIN Protected">
                <Shield className="w-3 h-3 text-emerald-400" />
              </span>
            )}
            <Users className="w-3 h-3 text-zinc-400 hidden sm:block" />
          </button>
        </div>
      </div>
    </header>
  );
};
