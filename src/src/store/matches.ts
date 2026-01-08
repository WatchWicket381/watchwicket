import { MatchState } from "../matchTypes";
import { clampSquadSizeToFormat } from "../utils/squadConstraints";

const STORAGE_KEY = "ww_matches_v1";
const LEGACY_KEY = "watchwicket_pro_state";

export interface MatchEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  state: MatchState;
}

export interface MatchSummary {
  id: string;
  createdAt: string;
  updatedAt: string;
  teamAName: string;
  teamBName: string;
  format: string;
  status: "Upcoming" | "In Progress" | "Completed";
}

function getAllMatches(): MatchEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as MatchEntry[];
    }
  } catch (e) {
    console.error("Error loading matches:", e);
  }
  return [];
}

function saveAllMatches(matches: MatchEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
  } catch (e) {
    console.error("Error saving matches:", e);
  }
}

function getMatchStatus(state: MatchState): "Upcoming" | "In Progress" | "Completed" {
  const currentInning = state.innings[state.currentInnings];

  if (!currentInning) return "Upcoming";

  if (currentInning.legalBalls === 0 && state.currentInnings === 0) {
    return "Upcoming";
  }

  const allInningsCompleted = state.innings
    .slice(0, state.inningsCount)
    .every(inn => inn.completed);

  if (allInningsCompleted) {
    return "Completed";
  }

  return "In Progress";
}

export function listMatches(): MatchSummary[] {
  const matches = getAllMatches();
  return matches.map(entry => ({
    id: entry.id,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    teamAName: entry.state.teamAName,
    teamBName: entry.state.teamBName,
    format: entry.state.format,
    status: getMatchStatus(entry.state),
  }));
}

export function loadMatch(id: string): MatchState | null {
  const matches = getAllMatches();
  const entry = matches.find(m => m.id === id);
  if (!entry) return null;

  const state = entry.state;

  // Migrate old matches: ensure totalBalls field exists
  for (const inn of state.innings) {
    if (typeof inn.totalBalls !== 'number') {
      inn.totalBalls = inn.legalBalls || 0;
    }
    // Keep legalBalls in sync for backwards compatibility
    inn.legalBalls = inn.totalBalls;
  }

  if (state.format === "INDOOR") {
    if (typeof state.oversLimit === "number" && state.oversLimit > 18) {
      state.oversLimit = 18;
    }

    for (const inn of state.innings) {
      if (typeof inn.oversLimit === "number" && inn.oversLimit > 18) {
        inn.oversLimit = 18;
      }
    }
  }

  const clampedSquadSize = clampSquadSizeToFormat(state.squadSize, state.format);
  if (state.squadSize !== clampedSquadSize) {
    state.squadSize = clampedSquadSize;
  }

  if (state.teamAPlayers.length > state.squadSize) {
    state.teamAPlayers = state.teamAPlayers.slice(0, state.squadSize);
    if (!state.teamAPlayers.find(p => p.id === state.teamACaptainId)) {
      state.teamACaptainId = null;
    }
    if (!state.teamAPlayers.find(p => p.id === state.teamAKeeperId)) {
      state.teamAKeeperId = null;
    }
  }

  if (state.teamBPlayers.length > state.squadSize) {
    state.teamBPlayers = state.teamBPlayers.slice(0, state.squadSize);
    if (!state.teamBPlayers.find(p => p.id === state.teamBCaptainId)) {
      state.teamBCaptainId = null;
    }
    if (!state.teamBPlayers.find(p => p.id === state.teamBKeeperId)) {
      state.teamBKeeperId = null;
    }
  }

  return state;
}

export function saveMatch(id: string, state: MatchState): void {
  const matches = getAllMatches();
  const existingIndex = matches.findIndex(m => m.id === id);

  const entry: MatchEntry = {
    id,
    createdAt: state.createdAt,
    updatedAt: new Date().toISOString(),
    state: { ...state, updatedAt: new Date().toISOString() },
  };

  if (existingIndex >= 0) {
    matches[existingIndex] = entry;
  } else {
    matches.push(entry);
  }

  saveAllMatches(matches);
}

export function deleteMatch(id: string): void {
  const matches = getAllMatches();
  const filtered = matches.filter(m => m.id !== id);
  saveAllMatches(filtered);
}

export function createNewMatchId(): string {
  return `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function migrateLegacyMatch(): void {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return;

    const existingMatches = getAllMatches();
    if (existingMatches.length > 0) return;

    const state = JSON.parse(legacy) as MatchState;

    // Migrate old matches: ensure totalBalls field exists
    for (const inn of state.innings) {
      if (typeof inn.totalBalls !== 'number') {
        inn.totalBalls = inn.legalBalls || 0;
      }
      inn.legalBalls = inn.totalBalls;
    }

    if (state.format === "INDOOR") {
      if (typeof state.oversLimit === "number" && state.oversLimit > 18) {
        state.oversLimit = 18;
      }

      for (const inn of state.innings) {
        if (typeof inn.oversLimit === "number" && inn.oversLimit > 18) {
          inn.oversLimit = 18;
        }
      }
    }

    const clampedSquadSize = clampSquadSizeToFormat(state.squadSize, state.format);
    if (state.squadSize !== clampedSquadSize) {
      state.squadSize = clampedSquadSize;
    }

    if (state.teamAPlayers.length > state.squadSize) {
      state.teamAPlayers = state.teamAPlayers.slice(0, state.squadSize);
      if (!state.teamAPlayers.find(p => p.id === state.teamACaptainId)) {
        state.teamACaptainId = null;
      }
      if (!state.teamAPlayers.find(p => p.id === state.teamAKeeperId)) {
        state.teamAKeeperId = null;
      }
    }

    if (state.teamBPlayers.length > state.squadSize) {
      state.teamBPlayers = state.teamBPlayers.slice(0, state.squadSize);
      if (!state.teamBPlayers.find(p => p.id === state.teamBCaptainId)) {
        state.teamBCaptainId = null;
      }
      if (!state.teamBPlayers.find(p => p.id === state.teamBKeeperId)) {
        state.teamBKeeperId = null;
      }
    }

    const id = createNewMatchId();

    const entry: MatchEntry = {
      id,
      createdAt: state.createdAt || new Date().toISOString(),
      updatedAt: state.updatedAt || new Date().toISOString(),
      state,
    };

    saveAllMatches([entry]);
    localStorage.removeItem(LEGACY_KEY);
  } catch (e) {
    console.error("Error migrating legacy match:", e);
  }
}
