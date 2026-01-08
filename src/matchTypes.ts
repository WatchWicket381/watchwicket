// ===============================
// WATCHWICKET SCOREBOX - TYPES
// ===============================

// Match formats
export type MatchFormat = "INDOOR" | "T20" | "ODI" | "TEST";

// Simple Player (profiles later)
export interface Player {
  id: string;       // unique ID
  name: string;     // player name
  isOut: boolean;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  dismissal?: string | null;
  dismissalDetails?: {
    type: string;
    bowlerName?: string;
    fielderName?: string;
  };
  isCaptain?: boolean;
  isKeeper?: boolean;
  profileId?: string; // link to PlayerProfile
  photoUrl?: string; // player photo from profile
  outsCount?: number; // Indoor Mode only: tracks dismissals (0, 1, 2, etc.)
  isSubstitute?: boolean; // If player is a substitute (not in starting squad)
  isActive?: boolean; // If substitute is currently active (replaced another player)
  replacedPlayerId?: string; // ID of player this substitute replaced
  guest?: boolean; // If player is a guest (not saved to squad)
}

// Bowler stats (added automatically from deliveries)
export interface BowlerStats {
  playerId: string;
  overs: number;     
  balls: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  wides: number;
  noballs: number;
}

// Commentary entry
export interface CommentaryEntry {
  over: number;
  ball: number;
  text: string;
  auto?: boolean;
}

export type DismissalType = "Bowled" | "Caught" | "LBW" | "Run Out" | "Stumped" | "Hit Wicket" | "Other";

// Delivery
export interface Delivery {
  runs: number;
  isLegal: boolean;
  isWicket: boolean;
  batterId?: string;
  bowlerId?: string;
  dismissal?: string | null;
  dismissalType?: DismissalType;
  fielderId?: string | null;
  display: string; // "1", "4", "W", "Nb", etc.
  extraType?: "wide" | "noball" | "bye" | "legbye" | null;
  wallBonus?: boolean; // Indoor Mode only: marks if this delivery includes a wall bonus
  runsForRotation?: number; // Override for strike rotation logic (e.g., W+1 credits 2 runs but rotates as 1)
}

// One innings
export interface Inning {
  battingTeam: "A" | "B";
  bowlingTeam: "A" | "B";
  deliveries: Delivery[];
  totalRuns: number;
  wickets: number;
  totalBalls: number; // AUTHORITATIVE: Total legal balls bowled. Only incremented on legal delivery, decremented on undo.
  legalBalls: number; // DEPRECATED: kept for backwards compatibility, always equals totalBalls
  completed: boolean;
  target?: number | null;
  result?: string | null;
  oversLimit?: number | null; // null for TEST unlimited
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
  };
}

// Full match state
export interface MatchState {
  teamAName: string;
  teamBName: string;
  teamALogo?: string | null;
  teamBLogo?: string | null;

  format: MatchFormat;
  inningsCount: number;   // 1 for indoor, 2 for T20/ODI, 4 for tests
  currentInnings: number; // 0-index (0..3 max)
  innings: Inning[];

  // Team sheets (simple version)
  teamAPlayers: Player[];
  teamBPlayers: Player[];

  // Substitutes/Extra Batsmen
  teamASubstitutes?: Player[];
  teamBSubstitutes?: Player[];

  // Captain and Keeper
  teamACaptainId?: string | null;
  teamBCaptainId?: string | null;
  teamAKeeperId?: string | null;
  teamBKeeperId?: string | null;

  // Current batter/bowler
  strikerId?: string | null;
  nonStrikerId?: string | null;
  bowlerId?: string | null;

  // Settings
  oversLimit: number | null; // null = unlimited (Test Match)
  squadSize?: number; // Max players per team (default: 10 for indoor, 11 for others)

  // Indoor-specific batting order fields
  battingOrder: string[];           // array of playerIds for the batting team
  battingCycleDismissals: number;   // dismissals since last reset
  battingOrderReversed: boolean;    // whether the order has been flipped

  // Toss information
  toss?: {
    winnerTeam: "A" | "B" | null;
    decision: "BAT" | "BOWL" | null;
  };

  // Commentary
  commentary: CommentaryEntry[];

  // Match status
  status?: "draft" | "live" | "completed" | "abandoned" | "deleted";

  // Match metadata
  matchLocation?: string;
  matchDate?: string;
  matchTime?: string;
  hasActivity?: boolean;
  legalBalls?: number; // Total legal balls bowled across all innings
  isScheduled?: boolean; // If true, match is scheduled for later (not started immediately)
  isPublic?: boolean; // If true, match is publicly viewable (default: false)
  deletedAt?: string | null;
  completedAt?: string | null;

  // UI + meta
  createdAt: string;
  updatedAt: string;
}
