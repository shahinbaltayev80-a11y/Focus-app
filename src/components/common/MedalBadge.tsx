/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AchievementDefinition } from '../../types';

interface MedalBadgeProps {
  achievement: AchievementDefinition;
  isUnlocked: boolean;
  size?: 'sm' | 'md' | 'lg';
  progressPercent?: number;
}

export const MedalBadge: React.FC<MedalBadgeProps> = ({
  achievement,
  isUnlocked,
  size = 'md',
  progressPercent = 0,
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  }[size];

  const { tier, category, milestone, iconType } = achievement;

  // Tier color themes
  const tierThemes = {
    bronze: {
      gradient: 'from-amber-700 via-amber-600 to-amber-900',
      border: 'border-amber-700/60',
      ring: 'ring-amber-600/30',
      glow: 'shadow-amber-900/30',
      ribbon: '#b45309',
      metalColor: '#d97706',
      accent: '#fef3c7',
    },
    silver: {
      gradient: 'from-slate-300 via-zinc-200 to-slate-400',
      border: 'border-slate-300/80',
      ring: 'ring-slate-300/40',
      glow: 'shadow-slate-400/30',
      ribbon: '#64748b',
      metalColor: '#e2e8f0',
      accent: '#ffffff',
    },
    gold: {
      gradient: 'from-yellow-400 via-amber-300 to-yellow-600',
      border: 'border-yellow-400/90',
      ring: 'ring-yellow-400/40',
      glow: 'shadow-yellow-500/40',
      ribbon: '#d97706',
      metalColor: '#f59e0b',
      accent: '#fffbeb',
    },
    platinum: {
      gradient: 'from-teal-200 via-cyan-100 to-emerald-300',
      border: 'border-cyan-300/80',
      ring: 'ring-cyan-400/40',
      glow: 'shadow-teal-500/30',
      ribbon: '#0d9488',
      metalColor: '#2dd4bf',
      accent: '#f0fdfa',
    },
    diamond: {
      gradient: 'from-sky-300 via-indigo-200 to-blue-400',
      border: 'border-sky-300',
      ring: 'ring-sky-400/50',
      glow: 'shadow-sky-400/50',
      ribbon: '#3b82f6',
      metalColor: '#38bdf8',
      accent: '#f0f9ff',
    },
    master: {
      gradient: 'from-purple-400 via-pink-400 to-amber-300',
      border: 'border-purple-400/90',
      ring: 'ring-purple-400/50',
      glow: 'shadow-purple-500/50',
      ribbon: '#9333ea',
      metalColor: '#c084fc',
      accent: '#faf5ff',
    },
  }[tier];

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${isUnlocked ? 'group' : 'opacity-70'}`}>
      <div className={`relative ${sizeClasses} flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}>
        {/* SVG Illustrated Medal */}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id={`grad-${achievement.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isUnlocked ? tierThemes.metalColor : '#52525b'} />
              <stop offset="50%" stopColor={isUnlocked ? tierThemes.accent : '#71717a'} />
              <stop offset="100%" stopColor={isUnlocked ? (tier === 'gold' ? '#92400e' : '#3f3f46') : '#27272a'} />
            </linearGradient>

            <linearGradient id={`ribbon-${achievement.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isUnlocked ? tierThemes.ribbon : '#3f3f46'} />
              <stop offset="100%" stopColor={isUnlocked ? '#18181b' : '#18181b'} />
            </linearGradient>

            <filter id={`glow-${achievement.id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Ribbon Tails (behind medal) */}
          <polygon
            points="38,40 28,88 38,82 48,88 44,45"
            fill={`url(#ribbon-${achievement.id})`}
            opacity="0.95"
          />
          <polygon
            points="62,40 52,88 62,82 72,88 56,45"
            fill={`url(#ribbon-${achievement.id})`}
            opacity="0.95"
          />

          {/* Outer Sunburst / Wreath Teeth */}
          <circle
            cx="50"
            cy="46"
            r="38"
            fill="none"
            stroke={isUnlocked ? `url(#grad-${achievement.id})` : '#3f3f46'}
            strokeWidth="2.5"
            strokeDasharray="4 3"
          />

          {/* Medal Main Outer Rim */}
          <circle
            cx="50"
            cy="46"
            r="33"
            fill={isUnlocked ? '#18181b' : '#18181b'}
            stroke={isUnlocked ? `url(#grad-${achievement.id})` : '#3f3f46'}
            strokeWidth="3.5"
          />

          {/* Inner Inset Rim */}
          <circle
            cx="50"
            cy="46"
            r="26"
            fill={isUnlocked ? '#09090b' : '#09090b'}
            stroke={isUnlocked ? (tier === 'diamond' ? '#38bdf8' : tierThemes.metalColor) : '#27272a'}
            strokeWidth="1.5"
          />

          {/* Center Emblem Graphic */}
          {isUnlocked ? (
            <g transform="translate(50, 46) scale(0.9)">
              {category === 'consistency' ? (
                // Flame / Will icon
                <path
                  d="M0,-14 C4,-9 10,-3 10,4 C10,11 5,14 0,14 C-5,14 -10,11 -10,4 C-10,-2 -4,-7 0,-14 Z M0,-4 C-2,-1 -4,1 -4,4 C-4,6 -2,8 0,8 C2,8 4,6 4,4 C4,1 2,-1 0,-4 Z"
                  fill={`url(#grad-${achievement.id})`}
                />
              ) : (
                // Time / Focus Gear / Hourglass icon
                <path
                  d="M-8,-12 L8,-12 L5,-2 L8,8 L-8,8 L-5,-2 Z M-4,-10 L4,-10 L0,-4 Z M0,2 L4,6 L-4,6 Z"
                  fill={`url(#grad-${achievement.id})`}
                />
              )}
            </g>
          ) : (
            // Lock icon
            <g transform="translate(50, 46) scale(0.8)">
              <rect x="-8" y="-4" width="16" height="14" rx="2" fill="#52525b" />
              <path
                d="M-5,-4 V-9 C-5,-12.5 5,-12.5 5,-9 V-4"
                fill="none"
                stroke="#52525b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="0" cy="3" r="1.5" fill="#18181b" />
            </g>
          )}

          {/* Star or Milestone Number on medal bottom */}
          <g transform="translate(50, 46)">
            {isUnlocked ? (
              <text
                x="0"
                y="20"
                textAnchor="middle"
                fontSize="7"
                fontWeight="bold"
                fill={tierThemes.metalColor}
                letterSpacing="0.5"
              >
                {category === 'consistency' ? `${milestone}D` : `${milestone}H`}
              </text>
            ) : null}
          </g>
        </svg>

        {/* Shine highlight */}
        {isUnlocked && (
          <div className="absolute top-1 left-2 w-4 h-4 bg-white/20 rounded-full blur-[1px] pointer-events-none" />
        )}
      </div>

      {/* Progress ring or unlocked badge label */}
      {!isUnlocked && progressPercent > 0 && (
        <div className="w-16 bg-zinc-800 rounded-full h-1.5 mt-1 overflow-hidden">
          <div
            className="bg-zinc-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      )}
    </div>
  );
};
