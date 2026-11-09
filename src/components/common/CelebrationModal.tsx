/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Flame, Camera, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ALL_ACHIEVEMENTS } from '../../services/achievements';
import { MedalBadge } from './MedalBadge';
import { MemoryModal } from '../memories/MemoryModal';

export const CelebrationModal: React.FC = () => {
  const { celebrationData, dismissCelebration } = useApp();
  const [showMemoryCapture, setShowMemoryCapture] = useState(false);

  if (!celebrationData || !celebrationData.show) return null;

  const achievement = celebrationData.achievementId
    ? ALL_ACHIEVEMENTS.find(a => a.id === celebrationData.achievementId)
    : null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-700/80 rounded-3xl max-w-sm w-full p-6 text-center space-y-5 animate-scale-up shadow-2xl relative">
          <button
            onClick={dismissCelebration}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon or Medal */}
          <div className="pt-2 flex justify-center">
            {achievement ? (
              <MedalBadge achievement={achievement} isUnlocked={true} size="lg" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Flame className="w-10 h-10 fill-amber-400 animate-bounce" />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-white tracking-tight">
              {celebrationData.title}
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed px-2">
              {celebrationData.message}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                setShowMemoryCapture(true);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-bold text-xs tracking-wide shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Capture This Moment</span>
            </button>

            <button
              onClick={dismissCelebration}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors"
            >
              Continue Focusing
            </button>
          </div>
        </div>
      </div>

      {showMemoryCapture && (
        <MemoryModal
          onClose={() => {
            setShowMemoryCapture(false);
            dismissCelebration();
          }}
        />
      )}
    </>
  );
};
