import { supabase } from "../supabaseClient";

export interface League {
  id: string;
  user_id: string;
  name: string;
  format: "INDOOR" | "T20" | "ODI";
  overs: number;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  created_at: string;
}

export interface LeagueTeam {
  id: string;
  league_id: string;
  team_id: string;
  team_name?: string;
  created_at: string;
}

export interface LeagueFixture {
  id: string;
  league_id: string;
  home_team_id: string;
  away_team_id: string;
  match_id: string | null;
  round: string | null;
  match_date: string;
  match_time: string;
  venue: string | null;
  notes: string | null;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  created_at: string;
  home_team_name?: string;
  away_team_name?: string;
}

export interface LeagueStanding {
  id: string;
  league_id: string;
  team_id: string;
  team_name?: string;
  matches_played: number;
  wins: number;
  losses: number;
  ties: number;
  no_results: number;
  points: number;
  runs_for: number;
  runs_against: number;
  overs_faced: number;
  overs_bowled: number;
  net_run_rate: number;
  updated_at: string;
}

// League CRUD operations
export async function listLeagues(): Promise<League[]> {
  const { data, error } = await supabase
    .from("leagues")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching leagues:", error);
    return [];
  }

  return data || [];
}

export async function getLeague(leagueId: string): Promise<League | null> {
  const { data, error } = await supabase
    .from("leagues")
    .select("*")
    .eq("id", leagueId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching league:", error);
    return null;
  }

  return data;
}

export async function createLeague(league: Omit<League, "id" | "user_id" | "created_at">): Promise<League | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("leagues")
    .insert({
      ...league,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating league:", error);
    return null;
  }

  return data;
}

export async function updateLeague(leagueId: string, updates: Partial<League>): Promise<boolean> {
  const { error } = await supabase
    .from("leagues")
    .update(updates)
    .eq("id", leagueId);

  if (error) {
    console.error("Error updating league:", error);
    return false;
  }

  return true;
}

export async function deleteLeague(leagueId: string): Promise<boolean> {
  const { error } = await supabase
    .from("leagues")
    .delete()
    .eq("id", leagueId);

  if (error) {
    console.error("Error deleting league:", error);
    return false;
  }

  return true;
}

// League Teams operations
export async function getLeagueTeams(leagueId: string): Promise<LeagueTeam[]> {
  const { data, error } = await supabase
    .from("league_teams")
    .select("*")
    .eq("league_id", leagueId);

  if (error) {
    console.error("Error fetching league teams:", error);
    return [];
  }

  return data || [];
}

export async function addTeamToLeague(leagueId: string, teamId: string): Promise<boolean> {
  const { error } = await supabase
    .from("league_teams")
    .insert({
      league_id: leagueId,
      team_id: teamId,
    });

  if (error) {
    console.error("Error adding team to league:", error);
    return false;
  }

  return true;
}

export async function removeTeamFromLeague(leagueId: string, teamId: string): Promise<boolean> {
  const { error } = await supabase
    .from("league_teams")
    .delete()
    .eq("league_id", leagueId)
    .eq("team_id", teamId);

  if (error) {
    console.error("Error removing team from league:", error);
    return false;
  }

  return true;
}

// League Fixtures operations
export async function getLeagueFixtures(leagueId: string): Promise<LeagueFixture[]> {
  const { data, error } = await supabase
    .from("league_fixtures")
    .select("*")
    .eq("league_id", leagueId)
    .order("match_date", { ascending: true })
    .order("match_time", { ascending: true });

  if (error) {
    console.error("Error fetching league fixtures:", error);
    return [];
  }

  return data || [];
}

export async function createFixture(fixture: Omit<LeagueFixture, "id" | "created_at" | "home_team_name" | "away_team_name">): Promise<LeagueFixture | null> {
  const { data, error } = await supabase
    .from("league_fixtures")
    .insert(fixture)
    .select()
    .single();

  if (error) {
    console.error("Error creating fixture:", error);
    return null;
  }

  return data;
}

export async function updateFixture(fixtureId: string, updates: Partial<LeagueFixture>): Promise<boolean> {
  const { error } = await supabase
    .from("league_fixtures")
    .update(updates)
    .eq("id", fixtureId);

  if (error) {
    console.error("Error updating fixture:", error);
    return false;
  }

  return true;
}

export async function deleteFixture(fixtureId: string): Promise<boolean> {
  const { error } = await supabase
    .from("league_fixtures")
    .delete()
    .eq("id", fixtureId);

  if (error) {
    console.error("Error deleting fixture:", error);
    return false;
  }

  return true;
}

// League Standings operations
export async function getLeagueStandings(leagueId: string): Promise<LeagueStanding[]> {
  const { data, error } = await supabase
    .from("league_standings")
    .select("*")
    .eq("league_id", leagueId)
    .order("points", { ascending: false })
    .order("net_run_rate", { ascending: false });

  if (error) {
    console.error("Error fetching league standings:", error);
    return [];
  }

  return data || [];
}

export async function updateLeagueStandings(
  leagueId: string,
  teamId: string,
  matchResult: {
    won: boolean;
    tied: boolean;
    noResult: boolean;
    runsScored: number;
    runsConceded: number;
    oversFaced: number;
    oversBowled: number;
  }
): Promise<boolean> {
  // Get or create standing
  const { data: existing } = await supabase
    .from("league_standings")
    .select("*")
    .eq("league_id", leagueId)
    .eq("team_id", teamId)
    .maybeSingle();

  const current = existing || {
    matches_played: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    no_results: 0,
    points: 0,
    runs_for: 0,
    runs_against: 0,
    overs_faced: 0,
    overs_bowled: 0,
  };

  // Calculate new values
  const newMatchesPlayed = current.matches_played + 1;
  const newWins = current.wins + (matchResult.won ? 1 : 0);
  const newLosses = current.losses + (!matchResult.won && !matchResult.tied && !matchResult.noResult ? 1 : 0);
  const newTies = current.ties + (matchResult.tied ? 1 : 0);
  const newNoResults = current.no_results + (matchResult.noResult ? 1 : 0);

  // Points: Win = 2, Tie/NR = 1, Loss = 0
  let pointsGained = 0;
  if (matchResult.won) pointsGained = 2;
  else if (matchResult.tied || matchResult.noResult) pointsGained = 1;

  const newPoints = current.points + pointsGained;
  const newRunsFor = current.runs_for + matchResult.runsScored;
  const newRunsAgainst = current.runs_against + matchResult.runsConceded;
  const newOversFaced = parseFloat(current.overs_faced.toString()) + matchResult.oversFaced;
  const newOversBowled = parseFloat(current.overs_bowled.toString()) + matchResult.oversBowled;

  // Calculate NRR: (runs_for / overs_faced) - (runs_against / overs_bowled)
  let newNRR = 0;
  if (newOversFaced > 0 && newOversBowled > 0) {
    newNRR = (newRunsFor / newOversFaced) - (newRunsAgainst / newOversBowled);
  }

  const updatedData = {
    league_id: leagueId,
    team_id: teamId,
    matches_played: newMatchesPlayed,
    wins: newWins,
    losses: newLosses,
    ties: newTies,
    no_results: newNoResults,
    points: newPoints,
    runs_for: newRunsFor,
    runs_against: newRunsAgainst,
    overs_faced: newOversFaced,
    overs_bowled: newOversBowled,
    net_run_rate: newNRR,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("league_standings")
    .upsert(updatedData);

  if (error) {
    console.error("Error updating league standings:", error);
    return false;
  }

  return true;
}
