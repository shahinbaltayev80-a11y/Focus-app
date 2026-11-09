/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FocusSession, StreakInfo } from '../types';

const STREAK_MILESTONES = [1, 3, 7, 15, 30, 50, 75, 100, 365, 500, 1000];
const QUALIFYING_SECONDS_PER_DAY = 15 * 60; // 15 minutes

export function formatLocalDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDaysDifference(dateStr1: string, dateStr2: string): number {
  // dateStr format: YYYY-MM-DD
  const d1 = new Date(dateStr1 + 'T00:00:00');
  const d2 = new Date(dateStr2 + 'T00:00:00');
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateStreaks(sessions: FocusSession[], now = Date.now()): StreakInfo {
  const todayStr = formatLocalDate(now);
  const yesterday = new Date(now - 24 * 60 * 60 * 1000);
  const yesterdayStr = formatLocalDate(yesterday.getTime());

  // Aggregate active focus seconds per day (only focus sessions, exclude breaks)
  const dailySeconds: Record<string, number> = {};

  for (const session of sessions) {
    if (session.sessionType === 'focus' && session.durationSeconds > 0) {
      const dateStr = formatLocalDate(session.startTime);
      dailySeconds[dateStr] = (dailySeconds[dateStr] || 0) + session.durationSeconds;
    }
  }

  // Filter only days with >= 15 minutes (900 seconds)
  const qualifyingDays = Object.keys(dailySeconds)
    .filter(dateStr => dailySeconds[dateStr] >= QUALIFYING_SECONDS_PER_DAY)
    .sort(); // ascending chronologically

  const todayMinutes = Math.floor((dailySeconds[todayStr] || 0) / 60);
  const isQualifiedToday = (dailySeconds[todayStr] || 0) >= QUALIFYING_SECONDS_PER_DAY;

  if (qualifyingDays.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastQualifyingDate: '',
      completedDaysCount: 0,
      nextMilestone: STREAK_MILESTONES[0],
      daysToNextMilestone: STREAK_MILESTONES[0],
      isQualifiedToday: false,
      todayMinutes,
    };
  }

  // Calculate longest streak across entire history
  let longestStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < qualifyingDays.length; i++) {
    const prevDate = qualifyingDays[i - 1];
    const currDate = qualifyingDays[i];
    const diff = getDaysDifference(prevDate, currDate);

    if (diff === 1) {
      tempStreak++;
    } else if (diff > 1) {
      tempStreak = 1;
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  // Calculate current streak
  // A current streak continues if the most recent qualifying day is either today or yesterday
  const lastQualifyingDay = qualifyingDays[qualifyingDays.length - 1];
  let currentStreak = 0;

  if (lastQualifyingDay === todayStr || lastQualifyingDay === yesterdayStr) {
    currentStreak = 1;
    for (let i = qualifyingDays.length - 1; i > 0; i--) {
      const curr = qualifyingDays[i];
      const prev = qualifyingDays[i - 1];
      if (getDaysDifference(prev, curr) === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else {
    currentStreak = 0; // Streak was broken
  }

  // Next milestone calculation
  const nextMilestone = STREAK_MILESTONES.find(m => m > currentStreak) || (currentStreak + 100);
  const daysToNextMilestone = Math.max(0, nextMilestone - currentStreak);

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    lastQualifyingDate: lastQualifyingDay,
    completedDaysCount: qualifyingDays.length,
    nextMilestone,
    daysToNextMilestone,
    isQualifiedToday,
    todayMinutes,
  };
}
