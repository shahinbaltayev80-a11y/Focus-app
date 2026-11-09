/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TimerMode = 'pomodoro' | 'custom' | 'super';

export interface TimerSettings {
  // Pomodoro
  pomoFocusMin: number;
  pomoShortBreakMin: number;
  pomoLongBreakMin: number;
  pomoSessionsBeforeLongBreak: number;
  
  // Custom
  customFocusMin: number;
  customBreakMin: number;
  customLongBreakMin: number;
  customSessions: number;
  customAutoTransition: boolean;

  // Super Mode
  superFocusMin: number;
  superBreakMin: number;

  // Notifications & Sound
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  ambientSound: AmbientSoundType;
  ambientVolume: number;
  breakAmbientSound: AmbientSoundType;
}

export type AmbientSoundType = 
  | 'none'
  | 'rain'
  | 'forest'
  | 'birds'
  | 'whitenoise'
  | 'clock'
  | 'library'
  | 'fireplace';

export interface Profile {
  id: string;
  name: string;
  avatar: string; // url or avatar preset identifier
  createdAt: number;
  updatedAt: number;
  pinHash?: string; // SHA-256 hash if PIN protected
  motivationalMessage?: string;
  themePreference: 'dark' | 'light' | 'system';
}

export type ProjectCategory = 
  | 'Study' 
  | 'Book Reading' 
  | 'Gym & Fitness' 
  | 'Language Learning' 
  | 'Professional Work' 
  | 'Personal Development' 
  | 'Custom';

export interface BookDetails {
  author?: string;
  totalPages: number;
  currentPage: number;
  coverImage?: string;
  readingTarget?: string;
  startDate?: string;
  completedDate?: string;
  isCompleted?: boolean;
}

export interface ProjectGoal {
  targetHours?: number;
  targetPages?: number;
  targetDate?: string;
}

export interface Project {
  id: string;
  profileId: string;
  name: string;
  description?: string;
  category: ProjectCategory;
  icon: string;
  color: string;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
  isBookProject?: boolean;
  bookDetails?: BookDetails;
  goal?: ProjectGoal;
}

export interface FocusSession {
  id: string;
  profileId: string;
  projectId?: string; // null or empty for unassigned
  mode: TimerMode;
  startTime: number;
  endTime: number;
  durationSeconds: number; // actual qualifying focused seconds (excludes pauses)
  completed: boolean;
  sessionType: 'focus' | 'short_break' | 'long_break';
  pagesRead?: number; // if reading session
  notes?: string;
  createdAt: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastQualifyingDate: string; // YYYY-MM-DD
  completedDaysCount: number;
  nextMilestone: number;
  daysToNextMilestone: number;
  isQualifiedToday: boolean;
  todayMinutes: number;
}

export type AchievementCategory = 'consistency' | 'focus_hours';

export interface AchievementDefinition {
  id: string;
  category: AchievementCategory;
  milestone: number; // days for consistency, hours for focus_hours
  title: string;
  description: string;
  congratsMessage: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master';
  iconType: string;
}

export interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: number;
  profileId: string;
}

export interface FocusMemory {
  id: string;
  profileId: string;
  date: string; // YYYY-MM-DD
  focusMinutes: number;
  streakCount: number;
  projectName?: string;
  achievementTitle?: string;
  quote: string;
  photoDataUrl?: string; // user upload or captured
  backgroundTemplate: string; // e.g. 'zen-black', 'cosmic-nebula', 'emerald-focus', 'gold-discipline'
  createdAt: number;
}
