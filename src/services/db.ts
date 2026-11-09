/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Profile, Project, FocusSession, UnlockedAchievement, FocusMemory, TimerSettings } from '../types';

const DB_NAME = 'FOCUS_PRODUCTIVITY_DB';
const DB_VERSION = 1;

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported in this browser environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Profiles
      if (!db.objectStoreNames.contains('profiles')) {
        db.createObjectStore('profiles', { keyPath: 'id' });
      }

      // Projects
      if (!db.objectStoreNames.contains('projects')) {
        const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
        projectStore.createIndex('profileId', 'profileId', { unique: false });
      }

      // Sessions
      if (!db.objectStoreNames.contains('sessions')) {
        const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
        sessionStore.createIndex('profileId', 'profileId', { unique: false });
        sessionStore.createIndex('projectId', 'projectId', { unique: false });
        sessionStore.createIndex('startTime', 'startTime', { unique: false });
      }

      // Achievements
      if (!db.objectStoreNames.contains('unlocked_achievements')) {
        const achStore = db.createObjectStore('unlocked_achievements', { keyPath: 'id' });
        achStore.createIndex('profileId', 'profileId', { unique: false });
      }

      // Memories
      if (!db.objectStoreNames.contains('memories')) {
        const memStore = db.createObjectStore('memories', { keyPath: 'id' });
        memStore.createIndex('profileId', 'profileId', { unique: false });
        memStore.createIndex('date', 'date', { unique: false });
      }

      // Settings
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'profileId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Generic transaction helper
async function performTx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest | void
): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const req = operation(store);

    if (req) {
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    } else {
      tx.oncomplete = () => resolve(undefined as unknown as T);
      tx.onerror = () => reject(tx.error);
    }
  });
}

// Profile Operations
export async function getProfiles(): Promise<Profile[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('profiles', 'readonly');
      const store = tx.objectStore('profiles');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('DB error in getProfiles, falling back to localStorage:', err);
    const local = localStorage.getItem('focus_profiles_fallback');
    return local ? JSON.parse(local) : [];
  }
}

export async function saveProfile(profile: Profile): Promise<void> {
  try {
    await performTx('profiles', 'readwrite', (store) => store.put(profile));
  } catch {
    // fallback
    const profiles = await getProfiles();
    const index = profiles.findIndex(p => p.id === profile.id);
    if (index >= 0) profiles[index] = profile;
    else profiles.push(profile);
    localStorage.setItem('focus_profiles_fallback', JSON.stringify(profiles));
  }
}

export async function deleteProfile(profileId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(
    ['profiles', 'projects', 'sessions', 'unlocked_achievements', 'memories', 'settings'],
    'readwrite'
  );
  
  // delete profile and settings
  tx.objectStore('profiles').delete(profileId);
  tx.objectStore('settings').delete(profileId);

  // Cascade delete in child stores by profileId index
  const cascadeStores = ['projects', 'sessions', 'unlocked_achievements', 'memories'];
  for (const storeName of cascadeStores) {
    const store = tx.objectStore(storeName);
    const index = store.index('profileId');
    const range = IDBKeyRange.only(profileId);
    const req = index.openKeyCursor(range);
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      }
    };
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Projects
export async function getProjects(profileId: string): Promise<Project[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('projects', 'readonly');
    const store = tx.objectStore('projects');
    const index = store.index('profileId');
    const req = index.getAll(profileId);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveProject(project: Project): Promise<void> {
  await performTx('projects', 'readwrite', (store) => store.put(project));
}

export async function deleteProject(projectId: string): Promise<void> {
  await performTx('projects', 'readwrite', (store) => store.delete(projectId));
}

// Sessions
export async function getSessions(profileId: string): Promise<FocusSession[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sessions', 'readonly');
    const store = tx.objectStore('sessions');
    const index = store.index('profileId');
    const req = index.getAll(profileId);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveSession(session: FocusSession): Promise<void> {
  await performTx('sessions', 'readwrite', (store) => store.put(session));
}

export async function deleteSession(sessionId: string): Promise<void> {
  await performTx('sessions', 'readwrite', (store) => store.delete(sessionId));
}

// Achievements
export async function getUnlockedAchievements(profileId: string): Promise<UnlockedAchievement[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('unlocked_achievements', 'readonly');
    const store = tx.objectStore('unlocked_achievements');
    const index = store.index('profileId');
    const req = index.getAll(profileId);
    req.onsuccess = () => {
      resolve((req.result || []).map((r: any) => ({
        achievementId: r.achievementId,
        unlockedAt: r.unlockedAt,
        profileId: r.profileId,
      })));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function unlockAchievement(profileId: string, achievementId: string): Promise<void> {
  const record = {
    id: `${profileId}_${achievementId}`,
    profileId,
    achievementId,
    unlockedAt: Date.now(),
  };
  await performTx('unlocked_achievements', 'readwrite', (store) => store.put(record));
}

// Memories
export async function getMemories(profileId: string): Promise<FocusMemory[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('memories', 'readonly');
    const store = tx.objectStore('memories');
    const index = store.index('profileId');
    const req = index.getAll(profileId);
    req.onsuccess = () => {
      const sorted = (req.result || []).sort((a, b) => b.createdAt - a.createdAt);
      resolve(sorted);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveMemory(memory: FocusMemory): Promise<void> {
  await performTx('memories', 'readwrite', (store) => store.put(memory));
}

export async function deleteMemory(memoryId: string): Promise<void> {
  await performTx('memories', 'readwrite', (store) => store.delete(memoryId));
}

// Settings
export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  pomoFocusMin: 25,
  pomoShortBreakMin: 5,
  pomoLongBreakMin: 15,
  pomoSessionsBeforeLongBreak: 4,

  customFocusMin: 45,
  customBreakMin: 10,
  customLongBreakMin: 20,
  customSessions: 3,
  customAutoTransition: false,

  superFocusMin: 180, // 3 hours
  superBreakMin: 25,

  notificationsEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  ambientSound: 'none',
  ambientVolume: 0.6,
  breakAmbientSound: 'birds',
};

export async function getSettings(profileId: string): Promise<TimerSettings> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const req = store.get(profileId);
      req.onsuccess = () => {
        if (req.result && req.result.settings) {
          resolve({ ...DEFAULT_TIMER_SETTINGS, ...req.result.settings });
        } else {
          resolve(DEFAULT_TIMER_SETTINGS);
        }
      };
      req.onerror = () => resolve(DEFAULT_TIMER_SETTINGS);
    });
  } catch {
    return DEFAULT_TIMER_SETTINGS;
  }
}

export async function saveSettings(profileId: string, settings: TimerSettings): Promise<void> {
  await performTx('settings', 'readwrite', (store) => store.put({ profileId, settings }));
}

// Full Export / Import for Backup & Restore
export async function exportAllData(): Promise<string> {
  const db = await openDB();
  const exportData: Record<string, any[]> = {};
  const storeNames = ['profiles', 'projects', 'sessions', 'unlocked_achievements', 'memories', 'settings'];

  const tx = db.transaction(storeNames, 'readonly');
  await Promise.all(
    storeNames.map((name) => {
      return new Promise<void>((resolve, reject) => {
        const store = tx.objectStore(name);
        const req = store.getAll();
        req.onsuccess = () => {
          exportData[name] = req.result || [];
          resolve();
        };
        req.onerror = () => reject(req.error);
      });
    })
  );

  return JSON.stringify({
    version: DB_VERSION,
    appName: 'FOCUS',
    exportedAt: new Date().toISOString(),
    data: exportData,
  }, null, 2);
}

export async function importData(jsonString: string): Promise<boolean> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.data) throw new Error('Invalid backup file structure');

    const db = await openDB();
    const storeNames = ['profiles', 'projects', 'sessions', 'unlocked_achievements', 'memories', 'settings'];
    const tx = db.transaction(storeNames, 'readwrite');

    for (const name of storeNames) {
      if (parsed.data[name] && Array.isArray(parsed.data[name])) {
        const store = tx.objectStore(name);
        for (const item of parsed.data[name]) {
          store.put(item);
        }
      }
    }

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.error('Import failed', err);
    return false;
  }
}
