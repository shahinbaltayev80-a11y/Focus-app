/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, BarChart3, Timer, FolderKanban } from 'lucide-react';
import { useApp, ActiveTab } from '../../context/AppContext';

export const DesktopNav: React.FC = () => {
  const { activeTab, setActiveTab, timer } = useApp();

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'timer', label: 'Focus Timer', icon: Timer },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
  ];

  return (
    <div className="hidden sm:flex items-center justify-center border-b border-zinc-800/80 bg-zinc-950/60 px-4 py-2">
      <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          const isTimerRunning = item.id === 'timer' && timer.isActive && !timer.isPaused;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <div className="relative">
                <Icon className="w-4 h-4" />
                {isTimerRunning && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
