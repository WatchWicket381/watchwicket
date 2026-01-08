import { MatchState } from '../matchTypes';

const CURRENT_MATCH_PREFIX = 'ww_current_match_';
const SYNC_STATUS_PREFIX = 'ww_sync_status_';

export interface PersistedMatch {
  matchId: string;
  state: MatchState;
  isSynced: boolean;
  lastSyncAttempt: string;
  lastLocalSave: string;
  userId: string;
}

export function saveMatchLocally(matchId: string, state: MatchState, userId: string, isSynced: boolean = false): void {
  try {
    const persisted: PersistedMatch = {
      matchId,
      state,
      isSynced,
      lastSyncAttempt: new Date().toISOString(),
      lastLocalSave: new Date().toISOString(),
      userId,
    };

    const key = `${CURRENT_MATCH_PREFIX}${matchId}`;
    localStorage.setItem(key, JSON.stringify(persisted));
  } catch (e) {
    console.error('Error saving match locally:', e);
  }
}

export function loadMatchLocally(matchId: string): PersistedMatch | null {
  try {
    const key = `${CURRENT_MATCH_PREFIX}${matchId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedMatch;
  } catch (e) {
    console.error('Error loading match locally:', e);
    return null;
  }
}

export function removeMatchLocally(matchId: string): void {
  try {
    const key = `${CURRENT_MATCH_PREFIX}${matchId}`;
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Error removing match locally:', e);
  }
}

export function getAllUnsyncedMatches(): PersistedMatch[] {
  try {
    const matches: PersistedMatch[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CURRENT_MATCH_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const match = JSON.parse(raw) as PersistedMatch;
          if (!match.isSynced) {
            matches.push(match);
          }
        }
      }
    }
    return matches.sort((a, b) =>
      new Date(b.lastLocalSave).getTime() - new Date(a.lastLocalSave).getTime()
    );
  } catch (e) {
    console.error('Error getting unsynced matches:', e);
    return [];
  }
}

export function getAllLocalMatches(userId: string): PersistedMatch[] {
  try {
    const matches: PersistedMatch[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CURRENT_MATCH_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const match = JSON.parse(raw) as PersistedMatch;
          if (match.userId === userId) {
            matches.push(match);
          }
        }
      }
    }
    return matches.sort((a, b) =>
      new Date(b.lastLocalSave).getTime() - new Date(a.lastLocalSave).getTime()
    );
  } catch (e) {
    console.error('Error getting local matches:', e);
    return [];
  }
}

export function markMatchAsSynced(matchId: string): void {
  try {
    const match = loadMatchLocally(matchId);
    if (match) {
      match.isSynced = true;
      match.lastSyncAttempt = new Date().toISOString();
      const key = `${CURRENT_MATCH_PREFIX}${matchId}`;
      localStorage.setItem(key, JSON.stringify(match));
    }
  } catch (e) {
    console.error('Error marking match as synced:', e);
  }
}

export function markMatchAsUnsynced(matchId: string): void {
  try {
    const match = loadMatchLocally(matchId);
    if (match) {
      match.isSynced = false;
      match.lastSyncAttempt = new Date().toISOString();
      const key = `${CURRENT_MATCH_PREFIX}${matchId}`;
      localStorage.setItem(key, JSON.stringify(match));
    }
  } catch (e) {
    console.error('Error marking match as unsynced:', e);
  }
}

export function hasUnsavedData(matchId: string): boolean {
  const match = loadMatchLocally(matchId);
  return match !== null && !match.isSynced;
}

export function cleanupOldLocalMatches(userId: string, daysToKeep: number = 7): void {
  try {
    const now = new Date().getTime();
    const cutoffTime = now - (daysToKeep * 24 * 60 * 60 * 1000);

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CURRENT_MATCH_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const match = JSON.parse(raw) as PersistedMatch;
          if (match.userId === userId && match.isSynced) {
            const saveTime = new Date(match.lastLocalSave).getTime();
            if (saveTime < cutoffTime) {
              localStorage.removeItem(key);
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('Error cleaning up old matches:', e);
  }
}
