/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Download,
  X,
  Smartphone,
  Share2,
  PlusSquare,
  CheckCircle2,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallModalProps {
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const handleInstallClick = async () => {
    const outcome = await install();
    if (outcome === 'accepted') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-zinc-100 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/pwa-192x192.png"
              alt="FOCUS"
              className="w-12 h-12 rounded-2xl shadow-md border border-indigo-500/30 object-cover"
            />
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Install FOCUS App</h3>
              <p className="text-xs text-zinc-400">Every Minute Builds a Better You</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status: Already installed */}
        {isInstalled ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-emerald-300">FOCUS is Installed</p>
              <p className="text-xs text-zinc-300">
                You are currently running FOCUS as an installed standalone Progressive Web App with full offline capabilities.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Direct 1-Click Install Button if supported */}
            {isInstallable && (
              <div className="space-y-2">
                <button
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm transition-all shadow-md active:scale-98"
                >
                  <Download className="w-4 h-4 text-zinc-950" />
                  Install Now on Device
                </button>
                <p className="text-[11px] text-center text-zinc-400">
                  Adds FOCUS directly to your home screen or app drawer.
                </p>
              </div>
            )}

            {/* Guided Instructions for iOS Safari */}
            {isIOS && (
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                  <Smartphone className="w-4 h-4" />
                  <span>iPhone / iPad Installation</span>
                </div>
                <ol className="text-xs text-zinc-300 space-y-2.5 list-decimal list-inside pl-1">
                  <li className="leading-relaxed">
                    Tap the <strong className="text-white">Share</strong> button <Share2 className="w-3.5 h-3.5 inline mx-1 text-zinc-400" /> in the Safari toolbar.
                  </li>
                  <li className="leading-relaxed">
                    Scroll down and tap <strong className="text-white">Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-zinc-400" />.
                  </li>
                  <li className="leading-relaxed">
                    Tap <strong className="text-white">Add</strong> in the top-right corner to complete.
                  </li>
                </ol>
              </div>
            )}

            {/* Guided Instructions for Android / Chrome */}
            {!isIOS && !isInstallable && (
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>Android (Chrome) Instructions</span>
                </div>
                <ol className="text-xs text-zinc-300 space-y-2 list-decimal list-inside pl-1">
                  <li>Tap the three-dots menu <strong className="text-white">(⋮)</strong> at the top right of Chrome.</li>
                  <li>Tap <strong className="text-white">Install app</strong> or <strong className="text-white">Add to Home screen</strong>.</li>
                  <li>Confirm installation when prompted.</li>
                </ol>

                <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-2 text-[11px] text-zinc-400">
                  <Laptop className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Desktop: Click the install icon in the browser address bar.</span>
                </div>
              </div>
            )}

            {/* PWA Benefits list */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60 space-y-1">
                <p className="font-semibold text-zinc-200">⚡ Instant Launch</p>
                <p className="text-[11px] text-zinc-400 leading-tight">No browser URL bar or distractions.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60 space-y-1">
                <p className="font-semibold text-zinc-200">📶 Full Offline Mode</p>
                <p className="text-[11px] text-zinc-400 leading-tight">Works without Wi-Fi or cellular signal.</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
