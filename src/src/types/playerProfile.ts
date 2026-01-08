export interface PlayerProfile {
  id: string;
  ownerId: string;
  linkedUserId?: string | null;
  name: string;
  nickname?: string;
  battingStyle?: "RHB" | "LHB" | "Other";
  bowlingStyle?: string;
  roles?: ("Captain" | "Keeper" | "All-rounder" | "Batter" | "Bowler")[];
  jerseyNumber?: number;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecentMatchEntry {
  matchId: string;
  date: string;
  opponent: string;
  format: string;
  battingRuns?: number;
  battingBalls?: number;
  dismissal?: string | null;
  bowlingOvers?: number;
  bowlingRuns?: number;
  bowlingWickets?: number;
}

export interface PlayerCareerStats {
  batting: {
    matches: number;
    innings: number;
    notOuts: number;
    runs: number;
    balls: number;
    highest: number;
    fifties: number;
    hundreds: number;
    fours: number;
    sixes: number;
    average: number;
    strikeRate: number;
  };
  bowling: {
    matches: number;
    overs: number;
    balls: number;
    runs: number;
    wickets: number;
    bestWickets: number;
    bestRuns: number;
    economy: number;
    fourW: number;
    fiveW: number;
  };
  fielding: {
    catches: number;
    stumpings: number;
    runOuts: number;
  };
  recent: RecentMatchEntry[];
}
