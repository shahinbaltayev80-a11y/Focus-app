/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  X,
  Sparkles,
  Cloud,
  HardDrive,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { exportAllData, importData } from '../../services/db';

interface DataBackupModalProps {
  onClose: () => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({ onClose }) => {
  const { loadDemoData, clearDemoData, hasDemoData, sessions } = useApp();

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  // Export full JSON file
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const json = await exportAllData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `focus-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Import JSON file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = reader.result as string;
        const success = await importData(text);
        if (success) {
          setImportStatus('Backup restored successfully! Refreshing view...');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          setImportStatus('Failed to import backup file. Invalid structure.');
        }
      } catch (err) {
        setImportStatus('Error reading backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleSimulatedCloudSync = () => {
    setIsSyncing(true);
    setSyncDone(false);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncDone(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-5 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-zinc-400" />
            <h3 className="text-base font-bold text-white">Data Storage & Backup</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xs font-semibold">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Local Persistence Status */}
        <div className="p-3.5 bg-zinc-950/70 rounded-2xl border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>Offline-First Persistent Storage</span>
            </div>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
              IndexedDB Active
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            All your profiles, timers, books, streaks, and achievements are safely persisted on your device. Works completely offline without internet.
          </p>
        </div>

        {/* Cloud Sync Status */}
        <div className="p-3.5 bg-zinc-950/70 rounded-2xl border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Cloud className="w-4 h-4 text-cyan-400" />
              <span>Cloud Synchronization</span>
            </div>
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700">
              Offline-First Mode
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Local data is fully isolated and persistent. Manual JSON Export/Restore can be used to transfer all profiles and sessions between devices. Remote cloud backend can be connected via Firebase.
          </p>
        </div>

        {/* JSON Export & Restore */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Manual Backup & Migration
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold border border-zinc-700 flex flex-col items-center justify-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4 text-zinc-300" />
              <span>Export JSON Backup</span>
            </button>

            <label className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold border border-zinc-700 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer">
              <Upload className="w-4 h-4 text-zinc-300" />
              <span>Restore from JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
          {importStatus && (
            <p className="text-[11px] text-amber-400 pt-1 text-center">{importStatus}</p>
          )}
        </div>

        {/* Testing / Demo Dataset Tool */}
        <div className="pt-2 border-t border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Testing & Demo Utilities
            </span>
            {hasDemoData && (
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                Demo Loaded
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Populate sample projects, reading books, and 8 days of focus sessions to test analytics graphs and streaks. Clearly isolated and removable anytime.
          </p>
          {hasDemoData ? (
            <button
              onClick={async () => {
                await clearDemoData();
                onClose();
              }}
              className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 rounded-xl text-xs font-bold transition-colors"
            >
              Clear Demo Dataset
            </button>
          ) : (
            <button
              onClick={async () => {
                await loadDemoData();
                onClose();
              }}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load 8-Day Demo Dataset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
