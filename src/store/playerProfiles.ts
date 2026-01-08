import { PlayerProfile } from "../types/playerProfile";

const STORAGE_KEY = "ww_players_v1";

function getAllProfiles(): PlayerProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as PlayerProfile[];
    }
  } catch (e) {
    console.error("Error loading player profiles:", e);
  }
  return [];
}

function saveAllProfiles(profiles: PlayerProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.error("Error saving player profiles:", e);
  }
}

export function listProfiles(): PlayerProfile[] {
  return getAllProfiles().sort((a, b) => a.name.localeCompare(b.name));
}

export function getProfile(id: string): PlayerProfile | undefined {
  const profiles = getAllProfiles();
  return profiles.find(p => p.id === id);
}

export function saveProfile(profile: PlayerProfile): void {
  const profiles = getAllProfiles();
  const existingIndex = profiles.findIndex(p => p.id === profile.id);

  const updatedProfile = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    profiles[existingIndex] = updatedProfile;
  } else {
    profiles.push(updatedProfile);
  }

  saveAllProfiles(profiles);
}

export function deleteProfile(id: string): void {
  const profiles = getAllProfiles();
  const filtered = profiles.filter(p => p.id !== id);
  saveAllProfiles(filtered);
}

export function createProfileId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function findOrCreateProfile(name: string): PlayerProfile {
  const profiles = getAllProfiles();
  const existing = profiles.find(p => p.name.toLowerCase() === name.toLowerCase());

  if (existing) {
    return existing;
  }

  const newProfile: PlayerProfile = {
    id: createProfileId(),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveProfile(newProfile);
  return newProfile;
}
