/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WifiOff, Database } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/95 border border-amber-500/40 text-amber-300 text-xs shadow-lg backdrop-blur-md animate-fade-in pointer-events-none">
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span className="font-medium">Offline Mode</span>
      <span className="text-[11px] text-zinc-400 flex items-center gap-1">
        • <Database className="w-3 h-3 text-emerald-400 inline" /> Local Storage Active
      </span>
    </div>
  );
};
