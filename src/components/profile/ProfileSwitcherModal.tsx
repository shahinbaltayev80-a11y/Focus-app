/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Plus,
  Shield,
  Trash2,
  RotateCcw,
  Check,
  X,
  Lock,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Profile } from '../../types';

interface ProfileSwitcherModalProps {
  onClose: () => void;
}

export const ProfileSwitcherModal: React.FC<ProfileSwitcherModalProps> = ({ onClose }) => {
  const {
    profiles,
    activeProfile,
    selectProfile,
    createProfile,
    deleteActiveProfile,
    resetActiveProfileData,
  } = useApp();

  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileAvatar, setNewProfileAvatar] = useState('avatar_1');
  const [newProfilePin, setNewProfilePin] = useState('');

  // PIN Unlock State
  const [pinPromptProfile, setPinPromptProfile] = useState<Profile | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Danger confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const avatarOptions = [
    { id: 'avatar_1', emoji: '⚔️', color: 'from-zinc-700 to-zinc-900' },
    { id: 'avatar_2', emoji: '🌌', color: 'from-purple-800 to-indigo-950' },
    { id: 'avatar_3', emoji: '☀️', color: 'from-amber-600 to-yellow-800' },
    { id: 'avatar_4', emoji: '🍃', color: 'from-emerald-700 to-teal-900' },
    { id: 'avatar_5', emoji: '🌊', color: 'from-blue-700 to-sky-950' },
    { id: 'avatar_6', emoji: '🔥', color: 'from-red-700 to-orange-950' },
  ];

  const handleProfileClick = async (profile: Profile) => {
    if (profile.id === activeProfile?.id) {
      onClose();
      return;
    }

    if (profile.pinHash) {
      setPinPromptProfile(profile);
      setEnteredPin('');
      setPinError(false);
    } else {
      await selectProfile(profile);
      onClose();
    }
  };

  const handleUnlockWithPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinPromptProfile) return;

    const success = await selectProfile(pinPromptProfile, enteredPin);
    if (success) {
      setPinPromptProfile(null);
      setEnteredPin('');
      onClose();
    } else {
      setPinError(true);
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    await createProfile(newProfileName.trim(), newProfileAvatar, newProfilePin);
    setIsCreating(false);
    setNewProfileName('');
    setNewProfilePin('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-zinc-400" />
            <h3 className="text-base font-bold text-white">Switch Profile</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xs font-semibold">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PIN Unlock Overlay */}
        {pinPromptProfile && (
          <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Enter PIN for {pinPromptProfile.name}</span>
            </div>
            <form onSubmit={handleUnlockWithPin} className="space-y-3">
              <input
                type="password"
                maxLength={6}
                autoFocus
                placeholder="Enter 4-6 digit PIN"
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value);
                  setPinError(false);
                }}
                className={`w-full bg-zinc-900 border rounded-xl px-3 py-2 text-center text-sm font-mono text-white ${
                  pinError ? 'border-red-500' : 'border-zinc-700'
                }`}
              />
              {pinError && <p className="text-[11px] text-red-400">Incorrect PIN. Try again.</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPinPromptProfile(null)}
                  className="flex-1 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-white text-zinc-950 rounded-xl text-xs font-bold"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Existing Profiles List */}
        {!isCreating && !pinPromptProfile && (
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Active Profiles on This Device
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {profiles.map((p) => {
                const isActive = p.id === activeProfile?.id;
                const av = avatarOptions.find(a => a.id === p.avatar) || avatarOptions[0];

                return (
                  <div
                    key={p.id}
                    onClick={() => handleProfileClick(p)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-zinc-800/90 border-white text-white shadow-sm'
                        : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-800/60 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${av.color} flex items-center justify-center text-base`}>
                        {av.emoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold">{p.name}</span>
                          {p.pinHash && <Shield className="w-3 h-3 text-emerald-400" />}
                        </div>
                        <span className="text-[10px] text-zinc-500">
                          {isActive ? 'Current Active Profile' : 'Tap to switch'}
                        </span>
                      </div>
                    </div>

                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Create New Profile Button */}
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all mt-3"
            >
              <Plus className="w-4 h-4" />
              <span>Create Another Profile</span>
            </button>

            {/* Danger Zone: Reset or Delete Active Profile */}
            <div className="pt-4 border-t border-zinc-800/80 space-y-2">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
                Manage Active Profile ({activeProfile?.name})
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="flex-1 py-2 px-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 text-[11px] font-medium flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Data</span>
                </button>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 py-2 px-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 text-[11px] font-medium flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Profile</span>
                </button>
              </div>

              {/* Reset Confirm Overlay */}
              {showResetConfirm && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-xs">
                  <p className="text-amber-300 font-medium">
                    Reset all sessions and achievements for {activeProfile?.name}?
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="px-2.5 py-1 text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        await resetActiveProfileData();
                        setShowResetConfirm(false);
                        onClose();
                      }}
                      className="px-3 py-1 bg-amber-500 text-black font-bold rounded-lg"
                    >
                      Confirm Reset
                    </button>
                  </div>
                </div>
              )}

              {/* Delete Confirm Overlay */}
              {showDeleteConfirm && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl space-y-2 text-xs">
                  <p className="text-red-300 font-medium">
                    Permanently delete {activeProfile?.name} and all its data?
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-2.5 py-1 text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        await deleteActiveProfile();
                        setShowDeleteConfirm(false);
                        onClose();
                      }}
                      className="px-3 py-1 bg-red-600 text-white font-bold rounded-lg"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Creation Form */}
        {isCreating && (
          <form onSubmit={handleCreateNew} className="space-y-4 text-xs">
            <div>
              <label className="text-zinc-400 font-semibold block mb-2">Select Avatar</label>
              <div className="grid grid-cols-6 gap-2">
                {avatarOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setNewProfileAvatar(opt.id)}
                    className={`h-10 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br ${opt.color} border transition-all ${
                      newProfileAvatar === opt.id ? 'ring-2 ring-white scale-110 border-white' : 'border-zinc-700/60'
                    }`}
                  >
                    {opt.emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-zinc-400 font-semibold block mb-1">New Profile Name *</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Student, Scholar, Athlete"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-zinc-400 font-semibold block mb-1">
                Optional PIN Protection (4-6 digits)
              </label>
              <input
                type="password"
                maxLength={6}
                placeholder="Leave blank for open access"
                value={newProfilePin}
                onChange={(e) => setNewProfilePin(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl font-semibold"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-white text-zinc-950 rounded-xl font-bold"
              >
                Create Profile
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
