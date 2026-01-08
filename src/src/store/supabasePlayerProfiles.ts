import { supabase } from "../supabaseClient";

export interface PlayerProfile {
  id: string;
  owner_id: string;
  linked_user_id?: string | null;
  name: string;
  nickname?: string;
  role: "Batsman" | "Bowler" | "All-rounder" | "Keeper";
  batting_style: "RHB" | "LHB";
  bowling_style?: string;
  photo_url?: string;
  jersey_number?: number;
  is_guest: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlayerStats {
  id: string;
  player_id: string;
  format: "ALL" | "INDOOR" | "T20" | "ODI";
  batting_matches: number;
  batting_innings: number;
  batting_not_outs: number;
  batting_runs: number;
  batting_balls: number;
  batting_highest: number;
  batting_fifties: number;
  batting_hundreds: number;
  batting_fours: number;
  batting_sixes: number;
  batting_average: number;
  batting_strike_rate: number;
  bowling_matches: number;
  bowling_overs: number;
  bowling_balls: number;
  bowling_runs: number;
  bowling_wickets: number;
  bowling_best_wickets: number;
  bowling_best_runs: number;
  bowling_economy: number;
  bowling_four_w: number;
  bowling_five_w: number;
  fielding_catches: number;
  fielding_stumpings: number;
  fielding_run_outs: number;
  updated_at: string;
}

export async function listPlayerProfiles(): Promise<PlayerProfile[]> {
  const { data, error } = await supabase
    .from("player_profiles")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error loading player profiles:", error);
    return [];
  }

  return data || [];
}

export async function getPlayerProfile(id: string): Promise<PlayerProfile | null> {
  const { data, error } = await supabase
    .from("player_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error loading player profile:", error);
    return null;
  }

  return data;
}

export async function createPlayerProfile(
  profile: Omit<PlayerProfile, "id" | "owner_id" | "created_at" | "updated_at">
): Promise<PlayerProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("No authenticated user");
    return null;
  }

  const { data, error } = await supabase
    .from("player_profiles")
    .insert([
      {
        ...profile,
        owner_id: user.id,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating player profile:", error);
    return null;
  }

  return data;
}

export async function updatePlayerProfile(
  id: string,
  updates: Partial<Omit<PlayerProfile, "id" | "owner_id" | "created_at" | "updated_at">>
): Promise<PlayerProfile | null> {
  const { data, error } = await supabase
    .from("player_profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating player profile:", error);
    return null;
  }

  return data;
}

export async function linkPlayerToUser(
  profileId: string,
  userId: string | null
): Promise<PlayerProfile | null> {
  return updatePlayerProfile(profileId, { linked_user_id: userId });
}

export async function deletePlayerProfile(id: string): Promise<boolean> {
  const { error } = await supabase.from("player_profiles").delete().eq("id", id);

  if (error) {
    console.error("Error deleting player profile:", error);
    return false;
  }

  return true;
}

export async function getPlayerStats(
  playerId: string,
  format: "ALL" | "INDOOR" | "T20" | "ODI" = "ALL"
): Promise<PlayerStats | null> {
  const { data, error } = await supabase
    .from("player_stats")
    .select("*")
    .eq("player_id", playerId)
    .eq("format", format)
    .maybeSingle();

  if (error) {
    console.error("Error loading player stats:", error);
    return null;
  }

  return data;
}

export async function getAllPlayerStats(playerId: string): Promise<PlayerStats[]> {
  const { data, error } = await supabase
    .from("player_stats")
    .select("*")
    .eq("player_id", playerId)
    .order("format", { ascending: true });

  if (error) {
    console.error("Error loading player stats:", error);
    return [];
  }

  return data || [];
}

export async function updatePlayerStats(
  playerId: string,
  format: "ALL" | "INDOOR" | "T20" | "ODI",
  updates: Partial<Omit<PlayerStats, "id" | "player_id" | "format" | "updated_at">>
): Promise<PlayerStats | null> {
  const { data, error } = await supabase
    .from("player_stats")
    .update(updates)
    .eq("player_id", playerId)
    .eq("format", format)
    .select()
    .single();

  if (error) {
    console.error("Error updating player stats:", error);
    return null;
  }

  return data;
}

export async function findOrCreatePlayerProfile(name: string): Promise<PlayerProfile | null> {
  const profiles = await listPlayerProfiles();
  const existing = profiles.find(
    (p) => p.name.toLowerCase().trim() === name.toLowerCase().trim()
  );

  if (existing) {
    return existing;
  }

  return await createPlayerProfile({
    name: name.trim(),
    role: "Batsman",
    batting_style: "RHB",
    is_guest: false,
  });
}

export async function searchPlayerProfiles(query: string): Promise<PlayerProfile[]> {
  const { data, error } = await supabase
    .from("player_profiles")
    .select("*")
    .ilike("name", `%${query}%`)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error searching player profiles:", error);
    return [];
  }

  return data || [];
}

export async function getMyLinkedProfile(userId: string): Promise<PlayerProfile | null> {
  const { data, error } = await supabase
    .from("player_profiles")
    .select("*")
    .eq("linked_user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error loading linked profile:", error);
    return null;
  }

  return data;
}

export async function getMyLinkedProfiles(userId: string): Promise<PlayerProfile[]> {
  const { data, error } = await supabase
    .from("player_profiles")
    .select("*")
    .eq("linked_user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error loading linked profiles:", error);
    return [];
  }

  return data || [];
}
