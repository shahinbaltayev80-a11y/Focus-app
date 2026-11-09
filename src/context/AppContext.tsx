/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import {
  Profile,
  Project,
  FocusSession,
  StreakInfo,
  UnlockedAchievement,
  TimerSettings,
  TimerMode,
  FocusMemory,
} from '../types';
import {
  getProfiles,
  saveProfile,
  deleteProfile as dbDeleteProfile,
  getProjects,
  saveProject as dbSaveProject,
  deleteProject as dbDeleteProject,
  getSessions,
  saveSession as dbSaveSession,
  deleteSession as dbDeleteSession,
  getUnlockedAchievements,
  unlockAchievement as dbUnlockAchievement,
  getSettings,
  saveSettings as dbSaveSettings,
  getMemories,
  saveMemory as dbSaveMemory,
  deleteMemory as dbDeleteMemory,
  DEFAULT_TIMER_SETTINGS,
  hashPin,
} from '../services/db';
import { calculateStreaks } from '../services/streaks';
import { ALL_ACHIEVEMENTS } from '../services/achievements';
import { soundEngine } from '../services/audio';

export type ActiveTab = 'profile' | 'analytics' | 'timer' | 'projects';

interface ActiveTimerState {
  isActive: boolean;
  isPaused: boolean;
  mode: TimerMode;
  sessionType: 'focus' | 'short_break' | 'long_break';
  totalDurationSeconds: number;
  remainingSeconds: number;
  elapsedFocusSeconds: number; // strictly qualifying focus time
  startTimestamp: number;
  lastResumeTimestamp: number;
  projectId?: string;
  cycleCount: number; // completed focus sessions in current sequence
}

interface AppContextType {
  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Profiles
  profiles: Profile[];
  activeProfile: Profile | null;
  selectProfile: (profile: Profile, enteredPin?: string) => Promise<boolean>;
  createProfile: (name: string, avatar: string, pin?: string) => Promise<Profile>;
  updateProfile: (profile: Profile, newPin?: string, removePin?: boolean) => Promise<void>;
  deleteActiveProfile: () => Promise<void>;
  resetActiveProfileData: () => Promise<void>;

  // Projects
  projects: Project[];
  activeProject: Project | null;
  setActiveProjectId: (id: string | undefined) => void;
  createProject: (project: Omit<Project, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>) => Promise<Project>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  startFocusForProject: (projectId: string) => void;

  // Sessions & Achievements
  sessions: FocusSession[];
  streakInfo: StreakInfo;
  unlockedAchievements: UnlockedAchievement[];
  memories: FocusMemory[];
  saveNewMemory: (memory: Omit<FocusMemory, 'id' | 'profileId' | 'createdAt'>) => Promise<FocusMemory>;
  deleteMemory: (id: string) => Promise<void>;

  // Settings
  settings: TimerSettings;
  updateSettings: (newSettings: Partial<TimerSettings>) => Promise<void>;

  // Active Timer
  timer: ActiveTimerState;
  setTimerMode: (mode: TimerMode) => void;
  startTimer: (mode?: TimerMode, projectId?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: (manualFinish?: boolean) => Promise<void>;
  skipBreak: () => void;
  addExtraMinutes: (minutes: number) => void;
  resetTimer: () => void;

  // Theme
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;

  // Celebration state
  celebrationData: {
    show: boolean;
    title: string;
    message: string;
    type: 'streak' | 'achievement' | 'session';
    achievementId?: string;
  } | null;
  dismissCelebration: () => void;

  // Demo data utility
  loadDemoData: () => Promise<void>;
  clearDemoData: () => Promise<void>;
  hasDemoData: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('timer');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(undefined);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  const [memories, setMemories] = useState<FocusMemory[]>([]);
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_TIMER_SETTINGS);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [celebrationData, setCelebrationData] = useState<AppContextType['celebrationData']>(null);
  const [hasDemoData, setHasDemoData] = useState<boolean>(false);

  // Active Timer State
  const [timer, setTimer] = useState<ActiveTimerState>({
    isActive: false,
    isPaused: false,
    mode: 'pomodoro',
    sessionType: 'focus',
    totalDurationSeconds: 25 * 60,
    remainingSeconds: 25 * 60,
    elapsedFocusSeconds: 0,
    startTimestamp: 0,
    lastResumeTimestamp: 0,
    cycleCount: 0,
  });

  const timerRef = useRef<ActiveTimerState>(timer);
  timerRef.current = timer;

  const timerIntervalRef = useRef<number | null>(null);

  // 1. Initial Load of Profiles
  useEffect(() => {
    async function init() {
      const allProfiles = await getProfiles();
      if (allProfiles.length === 0) {
        // Create initial default profile
        const defaultProfile: Profile = {
          id: 'profile_' + Date.now(),
          name: 'Focus Master',
          avatar: 'avatar_1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          motivationalMessage: 'Every minute builds a better you.',
          themePreference: 'dark',
        };
        await saveProfile(defaultProfile);
        setProfiles([defaultProfile]);
        setActiveProfile(defaultProfile);
      } else {
        setProfiles(allProfiles);
        // Look up last active profile or default to first
        const lastId = localStorage.getItem('focus_last_profile_id');
        const match = allProfiles.find(p => p.id === lastId);
        setActiveProfile(match || allProfiles[0]);
      }
    }
    init();
  }, []);

  // 2. Load active profile's data whenever activeProfile changes
  useEffect(() => {
    if (!activeProfile) return;
    localStorage.setItem('focus_last_profile_id', activeProfile.id);

    async function loadProfileData() {
      if (!activeProfile) return;
      const [projList, sessList, achList, memList, stngs] = await Promise.all([
        getProjects(activeProfile.id),
        getSessions(activeProfile.id),
        getUnlockedAchievements(activeProfile.id),
        getMemories(activeProfile.id),
        getSettings(activeProfile.id),
      ]);

      setProjects(projList);
      setSessions(sessList);
      setUnlockedAchievements(achList);
      setMemories(memList);
      setSettings(stngs);

      // Check if demo data exists
      const isDemo = sessList.some(s => s.notes === '__DEMO_DATA__');
      setHasDemoData(isDemo);

      // Check for saved active timer in localStorage
      try {
        const savedTimerStr = localStorage.getItem('focus_active_timer_' + activeProfile.id);
        if (savedTimerStr) {
          const savedTimer: ActiveTimerState = JSON.parse(savedTimerStr);
          if (savedTimer && savedTimer.isActive) {
            if (savedTimer.isPaused) {
              setTimer(savedTimer);
            } else {
              const now = Date.now();
              const elapsed = Math.floor((now - savedTimer.lastResumeTimestamp) / 1000);
              if (elapsed >= savedTimer.remainingSeconds) {
                // Timer finished while closed / reloaded
                if (savedTimer.sessionType === 'focus' && savedTimer.elapsedFocusSeconds + savedTimer.remainingSeconds > 0) {
                  const restoredSession: FocusSession = {
                    id: 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                    profileId: activeProfile.id,
                    projectId: savedTimer.projectId,
                    mode: savedTimer.mode,
                    startTime: savedTimer.startTimestamp,
                    endTime: now,
                    durationSeconds: savedTimer.elapsedFocusSeconds + savedTimer.remainingSeconds,
                    completed: true,
                    sessionType: 'focus',
                    createdAt: now,
                  };
                  await dbSaveSession(restoredSession);
                  const updatedList = [...sessList, restoredSession];
                  setSessions(updatedList);
                  await checkAchievementsAndMilestones(updatedList, restoredSession.durationSeconds);
                }
                localStorage.removeItem('focus_active_timer_' + activeProfile.id);
              } else {
                // Resume in progress
                const updatedRemaining = savedTimer.remainingSeconds - elapsed;
                const updatedFocus = savedTimer.sessionType === 'focus'
                  ? savedTimer.elapsedFocusSeconds + elapsed
                  : savedTimer.elapsedFocusSeconds;
                const restored: ActiveTimerState = {
                  ...savedTimer,
                  remainingSeconds: updatedRemaining,
                  elapsedFocusSeconds: updatedFocus,
                  lastResumeTimestamp: now,
                };
                setTimer(restored);
                localStorage.setItem('focus_active_timer_' + activeProfile.id, JSON.stringify(restored));
              }
            }
          }
        }
      } catch (err) {
        console.warn('Error restoring timer state:', err);
      }

      // Check if theme preferences apply
      if (activeProfile.themePreference === 'light') {
        setTheme('light');
        document.documentElement.classList.remove('dark');
      } else {
        setTheme('dark');
        document.documentElement.classList.add('dark');
      }
    }

    loadProfileData();
  }, [activeProfile?.id]);

  // Streak calculation derived from sessions
  const streakInfo = calculateStreaks(sessions);

  // Active Project object
  const activeProject = projects.find(p => p.id === (timer.projectId || activeProjectId)) || null;

  // 3. Sound volume sync
  useEffect(() => {
    soundEngine.setVolume(settings.ambientVolume);
    soundEngine.setMuted(!settings.soundEnabled);
  }, [settings.ambientVolume, settings.soundEnabled]);

  // Ambient sound play/stop based on timer state
  useEffect(() => {
    if (timer.isActive && !timer.isPaused) {
      if (timer.sessionType === 'focus') {
        soundEngine.playAmbient(settings.ambientSound);
      } else {
        soundEngine.playAmbient(settings.breakAmbientSound);
      }
    } else {
      soundEngine.stopAmbient();
    }

    return () => {
      soundEngine.stopAmbient();
    };
  }, [timer.isActive, timer.isPaused, timer.sessionType, settings.ambientSound, settings.breakAmbientSound]);

  // 4. Reliable Timestamp-based Timer Heartbeat & Background Catch-Up
  useEffect(() => {
    if (timer.isActive && !timer.isPaused) {
      timerIntervalRef.current = window.setInterval(() => {
        const cur = timerRef.current;
        if (!cur.isActive || cur.isPaused) return;

        const now = Date.now();
        const delta = Math.floor((now - cur.lastResumeTimestamp) / 1000);
        if (delta <= 0) return;

        if (delta >= cur.remainingSeconds) {
          // Timer step ended!
          handleTimerCompleted();
        } else {
          setTimer(prev => {
            const nextRemaining = prev.remainingSeconds - delta;
            const nextFocus = prev.sessionType === 'focus' ? prev.elapsedFocusSeconds + delta : prev.elapsedFocusSeconds;
            const updated: ActiveTimerState = {
              ...prev,
              remainingSeconds: nextRemaining,
              elapsedFocusSeconds: nextFocus,
              lastResumeTimestamp: now,
            };
            if (activeProfile) {
              localStorage.setItem('focus_active_timer_' + activeProfile.id, JSON.stringify(updated));
            }
            return updated;
          });
        }
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timer.isActive, timer.isPaused, timer.sessionType, activeProfile?.id]);

  // Visibility change & focus listener for immediate background catch-up
  useEffect(() => {
    const handleCatchUp = () => {
      if (document.visibilityState === 'visible' && timerRef.current.isActive && !timerRef.current.isPaused) {
        const cur = timerRef.current;
        const now = Date.now();
        const delta = Math.floor((now - cur.lastResumeTimestamp) / 1000);
        if (delta > 0) {
          if (delta >= cur.remainingSeconds) {
            handleTimerCompleted();
          } else {
            setTimer(prev => {
              const updated: ActiveTimerState = {
                ...prev,
                remainingSeconds: prev.remainingSeconds - delta,
                elapsedFocusSeconds: prev.sessionType === 'focus' ? prev.elapsedFocusSeconds + delta : prev.elapsedFocusSeconds,
                lastResumeTimestamp: now,
              };
              if (activeProfile) {
                localStorage.setItem('focus_active_timer_' + activeProfile.id, JSON.stringify(updated));
              }
              return updated;
            });
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleCatchUp);
    window.addEventListener('focus', handleCatchUp);
    return () => {
      document.removeEventListener('visibilitychange', handleCatchUp);
      window.removeEventListener('focus', handleCatchUp);
    };
  }, [activeProfile?.id]);

  // 5. Timer Completion Transition Handler
  const handleTimerCompleted = async () => {
    const cur = timerRef.current;
    if (!activeProfile) return;

    if (cur.sessionType === 'focus') {
      soundEngine.playChime('focus_end');
      // Save recorded focus session
      const newSession: FocusSession = {
        id: 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        profileId: activeProfile.id,
        projectId: cur.projectId,
        mode: cur.mode,
        startTime: cur.startTimestamp,
        endTime: Date.now(),
        durationSeconds: cur.elapsedFocusSeconds + (cur.totalDurationSeconds > 0 ? 1 : 0),
        completed: true,
        sessionType: 'focus',
        createdAt: Date.now(),
      };

      await dbSaveSession(newSession);
      const updatedSessions = [...sessions, newSession];
      setSessions(updatedSessions);

      // Trigger achievement & streak check
      await checkAchievementsAndMilestones(updatedSessions, newSession.durationSeconds);

      // Determine next phase (Short Break or Long Break)
      const nextCycleCount = cur.cycleCount + 1;
      let nextType: 'short_break' | 'long_break' = 'short_break';
      let breakSec = settings.pomoShortBreakMin * 60;

      if (cur.mode === 'pomodoro') {
        if (nextCycleCount >= settings.pomoSessionsBeforeLongBreak) {
          nextType = 'long_break';
          breakSec = settings.pomoLongBreakMin * 60;
        } else {
          nextType = 'short_break';
          breakSec = settings.pomoShortBreakMin * 60;
        }
      } else if (cur.mode === 'custom') {
        if (nextCycleCount >= settings.customSessions) {
          nextType = 'long_break';
          breakSec = settings.customLongBreakMin * 60;
        } else {
          nextType = 'short_break';
          breakSec = settings.customBreakMin * 60;
        }
      } else {
        // Super mode
        breakSec = settings.superBreakMin * 60;
      }

      setTimer({
        ...cur,
        sessionType: nextType,
        totalDurationSeconds: breakSec,
        remainingSeconds: breakSec,
        elapsedFocusSeconds: 0,
        cycleCount: nextType === 'long_break' ? 0 : nextCycleCount,
        lastResumeTimestamp: Date.now(),
      });
    } else {
      // Break ended! Transition back to focus
      soundEngine.playChime('break_end');
      let focusSec = 25 * 60;
      if (cur.mode === 'pomodoro') focusSec = settings.pomoFocusMin * 60;
      else if (cur.mode === 'custom') focusSec = settings.customFocusMin * 60;
      else focusSec = settings.superFocusMin * 60;

      const shouldAuto = cur.mode === 'custom' ? settings.customAutoTransition : true;

      setTimer({
        ...cur,
        isActive: shouldAuto,
        isPaused: !shouldAuto,
        sessionType: 'focus',
        totalDurationSeconds: focusSec,
        remainingSeconds: focusSec,
        elapsedFocusSeconds: 0,
        startTimestamp: Date.now(),
        lastResumeTimestamp: Date.now(),
      });
    }
  };

  // 6. Check and award achievements
  const checkAchievementsAndMilestones = async (allSessions: FocusSession[], recentDurationSeconds: number) => {
    if (!activeProfile) return;

    const newStreakInfo = calculateStreaks(allSessions);
    const totalFocusSeconds = allSessions
      .filter(s => s.sessionType === 'focus')
      .reduce((acc, s) => acc + s.durationSeconds, 0);
    const totalFocusHours = totalFocusSeconds / 3600;

    const alreadyUnlockedIds = new Set(unlockedAchievements.map(a => a.achievementId));
    const newUnlocked: UnlockedAchievement[] = [];

    for (const ach of ALL_ACHIEVEMENTS) {
      if (alreadyUnlockedIds.has(ach.id)) continue;

      let qualified = false;
      if (ach.category === 'consistency') {
        if (newStreakInfo.currentStreak >= ach.milestone || newStreakInfo.longestStreak >= ach.milestone) {
          qualified = true;
        }
      } else if (ach.category === 'focus_hours') {
        if (totalFocusHours >= ach.milestone) {
          qualified = true;
        }
      }

      if (qualified) {
        await dbUnlockAchievement(activeProfile.id, ach.id);
        const record = { achievementId: ach.id, unlockedAt: Date.now(), profileId: activeProfile.id };
        newUnlocked.push(record);
        alreadyUnlockedIds.add(ach.id);

        // Confetti & Celebration Modal
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        soundEngine.playChime('achievement');

        setCelebrationData({
          show: true,
          title: `Achievement Unlocked: ${ach.title}`,
          message: ach.congratsMessage,
          type: 'achievement',
          achievementId: ach.id,
        });
        break; // Show one at a time for maximum delight
      }
    }

    if (newUnlocked.length > 0) {
      setUnlockedAchievements(prev => [...prev, ...newUnlocked]);
    } else if (newStreakInfo.isQualifiedToday && recentDurationSeconds >= 15 * 60) {
      // Daily streak celebration!
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
      setCelebrationData({
        show: true,
        title: `Day ${newStreakInfo.currentStreak} Streak Secured!`,
        message: 'You have logged at least 15 qualifying focus minutes today. Every minute builds a better you!',
        type: 'streak',
      });
    }
  };

  // 7. Profile Actions
  const selectProfile = async (target: Profile, enteredPin?: string): Promise<boolean> => {
    if (target.pinHash) {
      if (!enteredPin) return false;
      const hashed = await hashPin(enteredPin);
      if (hashed !== target.pinHash) return false;
    }
    setActiveProfile(target);
    return true;
  };

  const createProfile = async (name: string, avatar: string, pin?: string): Promise<Profile> => {
    let pinHash: string | undefined = undefined;
    if (pin && pin.trim().length > 0) {
      pinHash = await hashPin(pin.trim());
    }
    const newProf: Profile = {
      id: 'profile_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: name.trim() || 'Focus Learner',
      avatar: avatar || 'avatar_1',
      pinHash,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      motivationalMessage: 'Focus brings clarity. Consistency brings mastery.',
      themePreference: 'dark',
    };
    await saveProfile(newProf);
    setProfiles(prev => [...prev, newProf]);
    setActiveProfile(newProf);
    return newProf;
  };

  const updateProfile = async (profile: Profile, newPin?: string, removePin?: boolean) => {
    const updated = { ...profile, updatedAt: Date.now() };
    if (removePin) {
      updated.pinHash = undefined;
    } else if (newPin && newPin.trim().length > 0) {
      updated.pinHash = await hashPin(newPin.trim());
    }
    await saveProfile(updated);
    setProfiles(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    setActiveProfile(updated);
  };

  const deleteActiveProfile = async () => {
    if (!activeProfile) return;
    const toDeleteId = activeProfile.id;
    await dbDeleteProfile(toDeleteId);
    const remaining = profiles.filter(p => p.id !== toDeleteId);
    setProfiles(remaining);
    if (remaining.length > 0) {
      setActiveProfile(remaining[0]);
    } else {
      // Re-create a fresh default profile
      const fresh: Profile = {
        id: 'profile_' + Date.now(),
        name: 'Focus Master',
        avatar: 'avatar_1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        motivationalMessage: 'Every minute builds a better you.',
        themePreference: 'dark',
      };
      await saveProfile(fresh);
      setProfiles([fresh]);
      setActiveProfile(fresh);
    }
  };

  const resetActiveProfileData = async () => {
    if (!activeProfile) return;
    // Wipe sessions, achievements, memories for current profile
    const id = activeProfile.id;
    await dbDeleteProfile(id);
    await saveProfile(activeProfile);
    setSessions([]);
    setUnlockedAchievements([]);
    setMemories([]);
    setProjects([]);
  };

  // 8. Project Actions
  const createProject = async (
    proj: Omit<Project, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>
  ): Promise<Project> => {
    if (!activeProfile) throw new Error('No active profile');
    const newProj: Project = {
      ...proj,
      id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      profileId: activeProfile.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dbSaveProject(newProj);
    setProjects(prev => [...prev, newProj]);
    return newProj;
  };

  const updateProject = async (project: Project) => {
    const updated = { ...project, updatedAt: Date.now() };
    await dbSaveProject(updated);
    setProjects(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  };

  const deleteProject = async (id: string) => {
    await dbDeleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) {
      setActiveProjectId(undefined);
    }
  };

  const startFocusForProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setTimer(prev => ({
      ...prev,
      projectId,
    }));
    setActiveTab('timer');
  };

  // 9. Memory Actions
  const saveNewMemory = async (
    mem: Omit<FocusMemory, 'id' | 'profileId' | 'createdAt'>
  ): Promise<FocusMemory> => {
    if (!activeProfile) throw new Error('No active profile');
    const newMemory: FocusMemory = {
      ...mem,
      id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      profileId: activeProfile.id,
      createdAt: Date.now(),
    };
    await dbSaveMemory(newMemory);
    setMemories(prev => [newMemory, ...prev]);
    return newMemory;
  };

  const deleteMemory = async (id: string) => {
    await dbDeleteMemory(id);
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  // 10. Settings Action
  const updateSettings = async (newSettings: Partial<TimerSettings>) => {
    if (!activeProfile) return;
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await dbSaveSettings(activeProfile.id, updated);
  };

  // 11. Timer Controls
  const setTimerMode = (newMode: TimerMode) => {
    let focusDurationSec = 25 * 60;
    if (newMode === 'pomodoro') {
      focusDurationSec = settings.pomoFocusMin * 60;
    } else if (newMode === 'custom') {
      focusDurationSec = settings.customFocusMin * 60;
    } else if (newMode === 'super') {
      focusDurationSec = settings.superFocusMin * 60;
    }

    setTimer(prev => {
      const updated: ActiveTimerState = {
        ...prev,
        mode: newMode,
        sessionType: 'focus',
        totalDurationSeconds: focusDurationSec,
        remainingSeconds: focusDurationSec,
        elapsedFocusSeconds: 0,
        isActive: false,
        isPaused: false,
        cycleCount: 0,
      };
      if (activeProfile) {
        localStorage.removeItem('focus_active_timer_' + activeProfile.id);
      }
      return updated;
    });
  };

  const startTimer = (mode?: TimerMode, projId?: string) => {
    const selectedMode = mode || timer.mode;
    let focusDurationSec = 25 * 60;

    if (selectedMode === 'pomodoro') {
      focusDurationSec = settings.pomoFocusMin * 60;
    } else if (selectedMode === 'custom') {
      focusDurationSec = settings.customFocusMin * 60;
    } else if (selectedMode === 'super') {
      focusDurationSec = settings.superFocusMin * 60;
    }

    const newTimer: ActiveTimerState = {
      isActive: true,
      isPaused: false,
      mode: selectedMode,
      sessionType: 'focus',
      totalDurationSeconds: focusDurationSec,
      remainingSeconds: focusDurationSec,
      elapsedFocusSeconds: 0,
      startTimestamp: Date.now(),
      lastResumeTimestamp: Date.now(),
      projectId: projId !== undefined ? projId : (timer.projectId || activeProjectId),
      cycleCount: 0,
    };

    setTimer(newTimer);
    if (activeProfile) {
      localStorage.setItem('focus_active_timer_' + activeProfile.id, JSON.stringify(newTimer));
    }
  };

  const pauseTimer = () => {
    setTimer(prev => {
      const updated = { ...prev, isPaused: true };
      if (activeProfile) {
        localStorage.setItem('focus_active_timer_' + activeProfile.id, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const resumeTimer = () => {
    setTimer(prev => {
      const updated = {
        ...prev,
        isPaused: false,
        lastResumeTimestamp: Date.now(),
      };
      if (activeProfile) {
        localStorage.setItem('focus_active_timer_' + activeProfile.id, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const stopTimer = async (manualFinish = false) => {
    const cur = timerRef.current;
    if (cur.isActive && cur.sessionType === 'focus' && cur.elapsedFocusSeconds > 0 && activeProfile) {
      // Save actual qualifying completed seconds (paused time is NOT counted!)
      const newSession: FocusSession = {
        id: 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        profileId: activeProfile.id,
        projectId: cur.projectId,
        mode: cur.mode,
        startTime: cur.startTimestamp,
        endTime: Date.now(),
        durationSeconds: cur.elapsedFocusSeconds,
        completed: manualFinish,
        sessionType: 'focus',
        createdAt: Date.now(),
      };
      await dbSaveSession(newSession);
      const updated = [...sessions, newSession];
      setSessions(updated);
      await checkAchievementsAndMilestones(updated, cur.elapsedFocusSeconds);
    }

    if (activeProfile) {
      localStorage.removeItem('focus_active_timer_' + activeProfile.id);
    }

    soundEngine.stopAmbient();
    setTimer(prev => ({
      ...prev,
      isActive: false,
      isPaused: false,
      remainingSeconds: prev.totalDurationSeconds,
      elapsedFocusSeconds: 0,
    }));
  };

  const skipBreak = () => {
    const cur = timerRef.current;
    let focusSec = 25 * 60;
    if (cur.mode === 'pomodoro') focusSec = settings.pomoFocusMin * 60;
    else if (cur.mode === 'custom') focusSec = settings.customFocusMin * 60;
    else focusSec = settings.superFocusMin * 60;

    const nextState: ActiveTimerState = {
      ...cur,
      sessionType: 'focus',
      totalDurationSeconds: focusSec,
      remainingSeconds: focusSec,
      elapsedFocusSeconds: 0,
      startTimestamp: Date.now(),
      lastResumeTimestamp: Date.now(),
    };

    setTimer(nextState);
    if (activeProfile) {
      localStorage.setItem('focus_active_timer_' + activeProfile.id, JSON.stringify(nextState));
    }
  };

  const addExtraMinutes = (minutes: number) => {
    const addSeconds = minutes * 60;
    setTimer(prev => {
      const updated = {
        ...prev,
        totalDurationSeconds: prev.totalDurationSeconds + addSeconds,
        remainingSeconds: prev.remainingSeconds + addSeconds,
      };
      if (activeProfile) {
        localStorage.setItem('focus_active_timer_' + activeProfile.id, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const resetTimer = () => {
    soundEngine.stopAmbient();
    if (activeProfile) {
      localStorage.removeItem('focus_active_timer_' + activeProfile.id);
    }
    setTimer(prev => ({
      ...prev,
      isActive: false,
      isPaused: false,
      remainingSeconds: prev.totalDurationSeconds,
      elapsedFocusSeconds: 0,
    }));
  };

  const dismissCelebration = () => {
    setCelebrationData(null);
  };

  // 12. Demo Data Generator & Cleaner (Requirement: never mix fake data with real data without user control)
  const loadDemoData = async () => {
    if (!activeProfile) return;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // Create 3 demo projects
    const p1 = await createProject({
      name: 'Advanced Mathematics',
      category: 'Study',
      icon: 'calculator',
      color: '#3b82f6',
      description: 'Calculus, Linear Algebra and Topology problem sets',
      isArchived: false,
    });

    const p2 = await createProject({
      name: 'Atomic Habits',
      category: 'Book Reading',
      icon: 'book',
      color: '#10b981',
      description: 'Tiny Changes, Remarkable Results by James Clear',
      isArchived: false,
      isBookProject: true,
      bookDetails: {
        author: 'James Clear',
        totalPages: 320,
        currentPage: 168,
        readingTarget: '20 pages per day',
        startDate: '2026-10-15',
        isCompleted: false,
      },
    });

    const p3 = await createProject({
      name: 'Mobile App Architecture',
      category: 'Professional Work',
      icon: 'code',
      color: '#8b5cf6',
      description: 'Designing modular offline-first productivity client',
      isArchived: false,
    });

    // Create 8 days of consecutive qualifying sessions for streak
    const demoSessions: FocusSession[] = [];
    for (let dayOffset = 7; dayOffset >= 0; dayOffset--) {
      const sessionDayStart = now - dayOffset * dayMs;
      // 2 sessions per day (30 mins and 25 mins)
      demoSessions.push({
        id: 'demo_s_' + dayOffset + '_1',
        profileId: activeProfile.id,
        projectId: p1.id,
        mode: 'pomodoro',
        startTime: sessionDayStart + 9 * 3600 * 1000,
        endTime: sessionDayStart + 9.5 * 3600 * 1000,
        durationSeconds: 30 * 60,
        completed: true,
        sessionType: 'focus',
        notes: '__DEMO_DATA__',
        createdAt: sessionDayStart,
      });

      demoSessions.push({
        id: 'demo_s_' + dayOffset + '_2',
        profileId: dayOffset % 2 === 0 ? p2.id : p3.id,
        startTime: sessionDayStart + 15 * 3600 * 1000,
        endTime: sessionDayStart + 15.6 * 3600 * 1000,
        durationSeconds: 35 * 60,
        mode: 'custom',
        completed: true,
        sessionType: 'focus',
        pagesRead: dayOffset % 2 === 0 ? 18 : undefined,
        notes: '__DEMO_DATA__',
        createdAt: sessionDayStart,
      });
    }

    for (const sess of demoSessions) {
      await dbSaveSession(sess);
    }

    const allSess = await getSessions(activeProfile.id);
    setSessions(allSess);
    setHasDemoData(true);
    await checkAchievementsAndMilestones(allSess, 35 * 60);
  };

  const clearDemoData = async () => {
    if (!activeProfile) return;
    const allSess = await getSessions(activeProfile.id);
    for (const s of allSess) {
      if (s.notes === '__DEMO_DATA__') {
        await dbDeleteSession(s.id);
      }
    }
    const filtered = allSess.filter(s => s.notes !== '__DEMO_DATA__');
    setSessions(filtered);
    setHasDemoData(false);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        profiles,
        activeProfile,
        selectProfile,
        createProfile,
        updateProfile,
        deleteActiveProfile,
        resetActiveProfileData,
        projects,
        activeProject,
        setActiveProjectId,
        createProject,
        updateProject,
        deleteProject,
        startFocusForProject,
        sessions,
        streakInfo,
        unlockedAchievements,
        memories,
        saveNewMemory,
        deleteMemory,
        settings,
        updateSettings,
        timer,
        setTimerMode,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        skipBreak,
        addExtraMinutes,
        resetTimer,
        theme,
        setTheme,
        celebrationData,
        dismissCelebration,
        loadDemoData,
        clearDemoData,
        hasDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
