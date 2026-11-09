/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Camera,
  Download,
  Share2,
  X,
  Sparkles,
  Flame,
  Check,
  Palette,
  Image as ImageIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FocusMemory } from '../../types';

interface MemoryModalProps {
  onClose: () => void;
  presetStreak?: number;
  presetMinutes?: number;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  onClose,
  presetStreak,
  presetMinutes,
}) => {
  const {
    activeProfile,
    streakInfo,
    activeProject,
    saveNewMemory,
  } = useApp();

  const currentStreak = presetStreak ?? streakInfo.currentStreak;
  const currentMinutes = presetMinutes ?? (streakInfo.todayMinutes || 25);

  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedQuote, setSelectedQuote] = useState(
    'Discipline is becoming your habit. Every minute builds a better you.'
  );
  const [backgroundTemplate, setBackgroundTemplate] = useState<'zen-dark' | 'cosmic' | 'emerald' | 'gold'>('zen-dark');
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const quotes = [
    'Another day. Another victory.',
    'Discipline is becoming your habit. Every minute builds a better you.',
    'Small steps. Extraordinary results.',
    'Consistency over intensity. Showing up is everything.',
    'Mastery is forged in silence.',
  ];

  const templates = [
    { id: 'zen-dark', label: 'Obsidian Noir', class: 'from-zinc-950 via-zinc-900 to-black text-white' },
    { id: 'cosmic', label: 'Cosmic Violet', class: 'from-indigo-950 via-purple-950 to-zinc-950 text-purple-100' },
    { id: 'emerald', label: 'Deep Emerald', class: 'from-emerald-950 via-teal-950 to-zinc-950 text-emerald-100' },
    { id: 'gold', label: 'Royal Aurum', class: 'from-amber-950 via-yellow-950 to-zinc-950 text-amber-100' },
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveMemory = async () => {
    if (hasSaved) return;
    setIsSaving(true);
    try {
      await saveNewMemory({
        date: new Date().toISOString().split('T')[0],
        focusMinutes: currentMinutes,
        streakCount: currentStreak,
        projectName: activeProject?.name,
        quote: selectedQuote,
        photoDataUrl: uploadedPhotoUrl || undefined,
        backgroundTemplate,
      });
      setHasSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Render canvas directly to export 9:16 high-res image
  const handleDownloadImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 1920);
    if (backgroundTemplate === 'cosmic') {
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.5, '#3b0764');
      grad.addColorStop(1, '#09090b');
    } else if (backgroundTemplate === 'emerald') {
      grad.addColorStop(0, '#022c22');
      grad.addColorStop(0.5, '#134e4a');
      grad.addColorStop(1, '#09090b');
    } else if (backgroundTemplate === 'gold') {
      grad.addColorStop(0, '#451a03');
      grad.addColorStop(0.5, '#713f12');
      grad.addColorStop(1, '#09090b');
    } else {
      grad.addColorStop(0, '#09090b');
      grad.addColorStop(0.5, '#18181b');
      grad.addColorStop(1, '#000000');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Decorative border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 4;
    ctx.strokeRect(60, 60, 960, 1800);

    // Header Logo
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FOCUS', 540, 180);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Every Minute Builds a Better You', 540, 230);

    // Flame & Streak Count
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 160px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${currentStreak}`, 540, 620);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('DAY FOCUS STREAK', 540, 700);

    // Focus minutes & project
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '32px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${currentMinutes} Minutes Dedicated Today`, 540, 780);

    if (activeProject) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = '30px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`Project: ${activeProject.name}`, 540, 840);
    }

    // Motivational Quote
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 38px "Plus Jakarta Sans", serif';
    ctx.fillText(`"${selectedQuote}"`, 540, 1200);

    // Profile & Date Footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '28px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${activeProfile?.name || 'Warrior'} • ${new Date().toLocaleDateString()}`, 540, 1720);

    // Download trigger
    const link = document.createElement('a');
    link.download = `focus-memory-day-${currentStreak}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Day ${currentStreak} Focus Streak on FOCUS`,
          text: `"${selectedQuote}" - Logged ${currentMinutes} minutes of deep focus today! #FOCUS #EveryMinuteBuildsABetterYou`,
        });
      } catch {}
    } else {
      handleDownloadImage();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 space-y-5 animate-scale-up my-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Focus Memories</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-500 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 9:16 Vertical Story Card Preview */}
        <div
          ref={cardRef}
          className={`relative aspect-[9/16] max-h-[380px] mx-auto rounded-3xl p-6 flex flex-col justify-between items-center text-center shadow-2xl border border-white/20 bg-gradient-to-b ${
            templates.find(t => t.id === backgroundTemplate)?.class
          }`}
        >
          {/* Top Logo */}
          <div>
            <span className="font-extrabold tracking-widest text-xs uppercase block text-white/90">
              FOCUS
            </span>
            <span className="text-[9px] text-white/60 tracking-tight">
              Every Minute Builds a Better You
            </span>
          </div>

          {/* Center Graphic: Streak & Milestone */}
          <div className="my-auto space-y-2">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Flame className="w-9 h-9 text-amber-400 fill-amber-400" />
            </div>

            <div className="font-mono text-4xl font-extrabold tracking-tighter text-white">
              {currentStreak}
            </div>
            <div className="text-[11px] font-bold tracking-widest uppercase text-amber-400">
              Days Daily Streak
            </div>

            <div className="text-xs text-white/80 font-medium">
              {currentMinutes} min focused today
            </div>

            {activeProject && (
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] text-white/90 border border-white/15">
                {activeProject.name}
              </span>
            )}
          </div>

          {/* Bottom Quote & Author */}
          <div className="space-y-2 w-full">
            <p className="text-xs italic text-white/90 font-serif leading-relaxed px-2">
              "{selectedQuote}"
            </p>
            <div className="text-[10px] text-white/60 tracking-wider">
              {activeProfile?.name} • {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Controls: Template & Quote */}
        <div className="space-y-3">
          {/* Background Theme Selector */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Card Style
            </label>
            <div className="grid grid-cols-4 gap-2">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => setBackgroundTemplate(t.id as any)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                    backgroundTemplate === t.id
                      ? 'border-white bg-zinc-800 text-white shadow-sm'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Quote Selection */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Motivational Message
            </label>
            <select
              value={selectedQuote}
              onChange={(e) => setSelectedQuote(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-white"
            >
              {quotes.map(q => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleDownloadImage}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold border border-zinc-700 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Save 9:16 Image</span>
          </button>

          <button
            onClick={handleSaveMemory}
            disabled={hasSaved || isSaving}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              hasSaved
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-white hover:bg-zinc-200 text-zinc-950 shadow-md'
            }`}
          >
            {hasSaved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved to Memories</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Save to Gallery</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
