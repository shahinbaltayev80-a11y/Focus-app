/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  User,
  Flame,
  Award,
  Shield,
  Edit3,
  Camera,
  Sparkles,
  Lock,
  Unlock,
  CheckCircle,
  Clock,
  Trash2,
  Calendar,
  Layers,
  Heart,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MedalBadge } from '../common/MedalBadge';
import { CONSISTENCY_ACHIEVEMENTS, FOCUS_HOUR_ACHIEVEMENTS } from '../../services/achievements';
import { AchievementDefinition, FocusMemory } from '../../types';
import { MemoryModal } from '../memories/MemoryModal';

interface ProfileViewProps {
  onOpenProfileSwitcher: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenProfileSwitcher }) => {
  const {
    activeProfile,
    updateProfile,
    streakInfo,
    unlockedAchievements,
    sessions,
    memories,
    deleteMemory,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'consistency' | 'focus_hours' | 'memories'>('consistency');
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementDefinition | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [viewingMemory, setViewingMemory] = useState<FocusMemory | null>(null);

  // Edit form state
  const [name, setName] = useState(activeProfile?.name || '');
  const [motivationalMessage, setMotivationalMessage] = useState(activeProfile?.motivationalMessage || '');
  const [avatar, setAvatar] = useState(activeProfile?.avatar || 'avatar_1');
  const [newPin, setNewPin] = useState('');
  const [removePin, setRemovePin] = useState(false);

  if (!activeProfile) return null;

  // Unlocked IDs
  const unlockedMap = new Map(unlockedAchievements.map(a => [a.achievementId, a.unlockedAt]));

  // Calculate Total Focus Hours (for focus-hour achievement progress)
  const totalFocusSeconds = sessions
    .filter(s => s.sessionType === 'focus')
    .reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalFocusHours = totalFocusSeconds / 3600;

  // Consistency unlocked count
  const consistencyUnlockedCount = CONSISTENCY_ACHIEVEMENTS.filter(a => unlockedMap.has(a.id)).length;
  const focusUnlockedCount = FOCUS_HOUR_ACHIEVEMENTS.filter(a => unlockedMap.has(a.id)).length;
  const totalUnlockedMedals = consistencyUnlockedCount + focusUnlockedCount;

  // Current Title Level
  const getLevelTitle = () => {
    if (totalUnlockedMedals >= 12) return 'Ascended Master';
    if (totalUnlockedMedals >= 8) return 'Elite Strategist';
    if (totalUnlockedMedals >= 5) return 'Iron Disciplinarian';
    if (totalUnlockedMedals >= 2) return 'Consistent Achiever';
    return 'Focus Initiate';
  };

  const avatarOptions = [
    { id: 'avatar_1', label: 'Spartan Helm', emoji: '⚔️', color: 'from-zinc-700 to-zinc-900' },
    { id: 'avatar_2', label: 'Cosmic Mind', emoji: '🌌', color: 'from-purple-800 to-indigo-950' },
    { id: 'avatar_3', label: 'Golden Sun', emoji: '☀️', color: 'from-amber-600 to-yellow-800' },
    { id: 'avatar_4', label: 'Emerald Sage', emoji: '🍃', color: 'from-emerald-700 to-teal-900' },
    { id: 'avatar_5', label: 'Deep Ocean', emoji: '🌊', color: 'from-blue-700 to-sky-950' },
    { id: 'avatar_6', label: 'Ruby Fire', emoji: '🔥', color: 'from-red-700 to-orange-950' },
  ];

  const currentAvatarObj = avatarOptions.find(a => a.id === activeProfile.avatar) || avatarOptions[0];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(
      {
        ...activeProfile,
        name: name.trim() || activeProfile.name,
        motivationalMessage: motivationalMessage.trim() || activeProfile.motivationalMessage,
        avatar,
      },
      newPin || undefined,
      removePin
    );
    setShowEditModal(false);
    setNewPin('');
    setRemovePin(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 pb-28 sm:pb-12 space-y-6">
      {/* 1. Identity & Profile Header Card */}
      <div className="relative overflow-hidden bg-zinc-900/80 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          {/* Avatar and Name */}
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${currentAvatarObj.color} flex items-center justify-center text-3xl shadow-xl border border-white/10 relative`}>
              <span>{currentAvatarObj.emoji}</span>
              {activeProfile.pinHash && (
                <div className="absolute -bottom-1 -right-1 p-1 bg-zinc-950 border border-emerald-500/40 rounded-full text-emerald-400">
                  <Shield className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {activeProfile.name}
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                  {getLevelTitle()}
                </span>
              </div>

              <p className="text-xs italic text-zinc-400 font-serif max-w-md">
                "{activeProfile.motivationalMessage || 'Every minute builds a better you.'}"
              </p>

              <p className="text-[11px] text-zinc-500 pt-1">
                Active Member since {new Date(activeProfile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Action Buttons: Edit Profile & Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setName(activeProfile.name);
                setMotivationalMessage(activeProfile.motivationalMessage || '');
                setAvatar(activeProfile.avatar);
                setShowEditModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700/60 transition-all active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={onOpenProfileSwitcher}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700/60 transition-all active:scale-95"
            >
              <User className="w-3.5 h-3.5" />
              <span>Switch</span>
            </button>
          </div>
        </div>

        {/* Consistency & Medal Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-zinc-800/80">
          {/* Current Streak */}
          <div className="p-3.5 bg-zinc-950/60 rounded-2xl border border-zinc-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Current Streak
              </span>
              <span className="text-lg font-mono font-bold text-white">
                {streakInfo.currentStreak} <span className="text-xs text-zinc-400">days</span>
              </span>
            </div>
          </div>

          {/* Longest Streak Record */}
          <div className="p-3.5 bg-zinc-950/60 rounded-2xl border border-zinc-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Longest Record
              </span>
              <span className="text-lg font-mono font-bold text-zinc-200">
                {streakInfo.longestStreak} <span className="text-xs text-zinc-400">days</span>
              </span>
            </div>
          </div>

          {/* Next Milestone */}
          <div className="p-3.5 bg-zinc-950/60 rounded-2xl border border-zinc-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Next Milestone
              </span>
              <span className="text-lg font-mono font-bold text-white">
                {streakInfo.nextMilestone} <span className="text-xs text-zinc-400">days</span>
              </span>
            </div>
          </div>

          {/* Total Medals */}
          <div className="p-3.5 bg-zinc-950/60 rounded-2xl border border-zinc-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Earned Medals
              </span>
              <span className="text-lg font-mono font-bold text-white">
                {totalUnlockedMedals} / {CONSISTENCY_ACHIEVEMENTS.length + FOCUS_HOUR_ACHIEVEMENTS.length}
              </span>
            </div>
          </div>
        </div>

        {/* Capture Memory Banner */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-950 rounded-2xl border border-amber-500/30">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h4 className="text-xs font-bold text-white">Focus Memories</h4>
              <p className="text-[11px] text-zinc-400">Capture your consistency moments into 9:16 vertical story cards.</p>
            </div>
          </div>
          <button
            onClick={() => setShowMemoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-all shadow-md active:scale-95 whitespace-nowrap"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Capture Moment</span>
          </button>
        </div>
      </div>

      {/* 2. Achievement Gallery Section */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 p-1 bg-zinc-900 rounded-2xl border border-zinc-800 text-xs">
            <button
              onClick={() => setActiveTab('consistency')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                activeTab === 'consistency'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Consistency ({consistencyUnlockedCount}/{CONSISTENCY_ACHIEVEMENTS.length})
            </button>

            <button
              onClick={() => setActiveTab('focus_hours')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                activeTab === 'focus_hours'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Focus Hours ({focusUnlockedCount}/{FOCUS_HOUR_ACHIEVEMENTS.length})
            </button>

            <button
              onClick={() => setActiveTab('memories')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                activeTab === 'memories'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Memories ({memories.length})
            </button>
          </div>
        </div>

        {/* A. Consistency Collection */}
        {activeTab === 'consistency' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CONSISTENCY_ACHIEVEMENTS.map((ach) => {
              const isUnlocked = unlockedMap.has(ach.id);
              const progressPercent = Math.min(100, Math.round((streakInfo.currentStreak / ach.milestone) * 100));

              return (
                <div
                  key={ach.id}
                  onClick={() => setSelectedAchievement(ach)}
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col items-center text-center space-y-3 ${
                    isUnlocked
                      ? 'bg-zinc-900/90 border-zinc-700 hover:border-zinc-500 shadow-md'
                      : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700/60 opacity-80'
                  }`}
                >
                  <MedalBadge
                    achievement={ach}
                    isUnlocked={isUnlocked}
                    size="md"
                    progressPercent={progressPercent}
                  />

                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white tracking-tight">{ach.title}</h4>
                    <span className="text-[10px] text-zinc-400 font-mono block">
                      {ach.milestone} Days Streak
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block ${
                      isUnlocked
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {isUnlocked ? 'Unlocked' : `${progressPercent}%`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* B. Focus Hours Collection */}
        {activeTab === 'focus_hours' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {FOCUS_HOUR_ACHIEVEMENTS.map((ach) => {
              const isUnlocked = unlockedMap.has(ach.id);
              const progressPercent = Math.min(100, Math.round((totalFocusHours / ach.milestone) * 100));

              return (
                <div
                  key={ach.id}
                  onClick={() => setSelectedAchievement(ach)}
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col items-center text-center space-y-3 ${
                    isUnlocked
                      ? 'bg-zinc-900/90 border-zinc-700 hover:border-zinc-500 shadow-md'
                      : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700/60 opacity-80'
                  }`}
                >
                  <MedalBadge
                    achievement={ach}
                    isUnlocked={isUnlocked}
                    size="md"
                    progressPercent={progressPercent}
                  />

                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white tracking-tight">{ach.title}</h4>
                    <span className="text-[10px] text-zinc-400 font-mono block">
                      {ach.milestone} Focus Hours
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block ${
                      isUnlocked
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {isUnlocked ? 'Unlocked' : `${progressPercent}%`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* C. Saved Memories Gallery */}
        {activeTab === 'memories' && (
          <div>
            {memories.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">No saved memories yet</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Celebrate your qualifying streak days by generating personalized 9:16 story cards.
                </p>
                <button
                  onClick={() => setShowMemoryModal(true)}
                  className="px-4 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-colors inline-block"
                >
                  Capture Today's Moment
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {memories.map((mem) => (
                  <div
                    key={mem.id}
                    className="group relative aspect-[9/16] bg-zinc-950 rounded-2xl p-4 border border-zinc-800/80 flex flex-col justify-between overflow-hidden shadow-lg"
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>{mem.date}</span>
                      <button
                        onClick={() => deleteMemory(mem.id)}
                        className="p-1 rounded text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-center space-y-1">
                      <div className="w-10 h-10 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                        <Flame className="w-5 h-5 fill-amber-400" />
                      </div>
                      <div className="text-2xl font-black font-mono text-white">{mem.streakCount}d</div>
                      <div className="text-[10px] font-bold uppercase text-amber-400">Streak</div>
                    </div>

                    <div className="space-y-1 text-center">
                      <p className="text-[11px] italic text-zinc-300 font-serif line-clamp-3">
                        "{mem.quote}"
                      </p>
                      <p className="text-[10px] text-zinc-500">{mem.focusMinutes} min focused</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 animate-scale-up">
            <MedalBadge
              achievement={selectedAchievement}
              isUnlocked={unlockedMap.has(selectedAchievement.id)}
              size="lg"
            />

            <div>
              <h3 className="text-base font-extrabold text-white">{selectedAchievement.title}</h3>
              <p className="text-xs text-zinc-400 mt-1">{selectedAchievement.description}</p>
            </div>

            <div className="p-3 bg-zinc-950/70 rounded-2xl border border-zinc-800 text-xs">
              {unlockedMap.has(selectedAchievement.id) ? (
                <div className="space-y-1">
                  <span className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Unlocked on{' '}
                    {new Date(unlockedMap.get(selectedAchievement.id)!).toLocaleDateString()}
                  </span>
                  <p className="text-zinc-300 italic">"{selectedAchievement.congratsMessage}"</p>
                </div>
              ) : (
                <div className="text-zinc-400">
                  <span className="text-zinc-300 font-semibold block mb-1">Requirement:</span>
                  {selectedAchievement.category === 'consistency'
                    ? `Maintain an unbroken ${selectedAchievement.milestone}-day focus streak (currently ${streakInfo.currentStreak}d).`
                    : `Accumulate ${selectedAchievement.milestone} active focus hours (currently ${totalFocusHours.toFixed(1)}h).`}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedAchievement(null)}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-zinc-400" />
                <span>Edit Profile</span>
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-zinc-500 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {/* Avatar Selection */}
              <div>
                <label className="text-zinc-400 font-semibold block mb-2">Avatar Emblem</label>
                <div className="grid grid-cols-6 gap-2">
                  {avatarOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAvatar(opt.id)}
                      className={`h-11 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br ${opt.color} border transition-all ${
                        avatar === opt.id ? 'ring-2 ring-white scale-110 border-white' : 'border-zinc-700/60'
                      }`}
                    >
                      {opt.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Profile Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              {/* Motivational Message */}
              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Personal Motto</label>
                <input
                  type="text"
                  value={motivationalMessage}
                  onChange={(e) => setMotivationalMessage(e.target.value)}
                  placeholder="e.g. Every minute builds a better you."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              {/* PIN Protection */}
              <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>PIN Protection</span>
                  </div>
                  {activeProfile.pinHash && (
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Protected
                    </span>
                  )}
                </div>

                <input
                  type="password"
                  maxLength={6}
                  placeholder={activeProfile.pinHash ? 'Enter new PIN to change' : 'Set 4-6 digit PIN'}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white"
                />

                {activeProfile.pinHash && (
                  <label className="flex items-center gap-2 pt-1 text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={removePin}
                      onChange={(e) => setRemovePin(e.target.checked)}
                      className="accent-white"
                    />
                    <span>Remove PIN protection</span>
                  </label>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold transition-colors"
              >
                Save Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Focus Memories Modal */}
      {showMemoryModal && (
        <MemoryModal
          onClose={() => setShowMemoryModal(false)}
        />
      )}
    </div>
  );
};
