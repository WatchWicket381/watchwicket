import { supabase } from '../supabaseClient';
import { MatchState } from '../matchTypes';
import { updatePlayerStatsFromMatch } from './statTracking';

export type MatchSummary = {
  id: string;
  userId: string;
  matchType: string;
  teamAName: string;
  teamBName: string;
  teamALogoUrl?: string | null;
  teamBLogoUrl?: string | null;
  status: string;
  format: string;
  matchData: MatchState;
  allowPlayerStatsView: boolean;
  allowTeamScorecardView: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type MatchListSummary = {
  id: string;
  userId: string;
  matchType: string;
  teamAName: string;
  teamBName: string;
  teamALogoUrl?: string | null;
  teamBLogoUrl?: string | null;
  status: string;
  format: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

/**
 * Save a match to Supabase database
 */
export async function saveMatchToDb(matchId: string, state: MatchState): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      console.warn('[saveMatchToDb] No authenticated session found');
      return { success: false, error: 'Please sign in to save matches' };
    }

    const user = session.user;

    const legalBalls = state.innings.reduce((total, inning) => {
      return total + inning.deliveries.filter(d => d.isLegal).length;
    }, 0);

    const hasActivity = legalBalls > 0;

    let matchStatus = state.status;
    if (!matchStatus) {
      if (hasActivity) {
        matchStatus = 'live';
      } else if (state.toss?.winnerTeam) {
        matchStatus = 'live';
      } else {
        matchStatus = 'draft';
      }
    } else if (matchStatus === 'Upcoming') {
      matchStatus = 'draft';
    } else if (matchStatus === 'In Progress') {
      matchStatus = 'live';
    } else if (matchStatus === 'Completed') {
      matchStatus = 'completed';
    }

    const existingMatch = await supabase
      .from('matches')
      .select('completed_at, status')
      .eq('id', matchId)
      .maybeSingle();

    const existingCompletedAt = existingMatch?.data?.completed_at || null;
    const existingStatus = existingMatch?.data?.status;
    const isExistingMatch = !!existingMatch?.data;

    // IMMUTABILITY CHECK: If match is already completed, block all updates
    if (existingCompletedAt || existingStatus === 'completed') {
      console.log('[saveMatchToDb] Match already completed. Blocking update to preserve immutability.');
      return { success: false, error: 'Cannot modify completed match. Match is immutable once completed.' };
    }

    const matchData: any = {
      id: matchId,
      user_id: user.id,
      match_type: state.format,
      team_a_name: state.teamAName,
      team_b_name: state.teamBName,
      team_a_logo_url: state.teamALogo || null,
      team_b_logo_url: state.teamBLogo || null,
      status: matchStatus,
      format: state.format,
      match_data: state,
      has_activity: hasActivity,
      legal_balls: legalBalls,
      is_public: state.isPublic || false,
      updated_at: new Date().toISOString(),
    };

    // Only set completed_at when completing a match (not on initial creation)
    if (matchStatus === 'completed' && !existingCompletedAt) {
      matchData.completed_at = new Date().toISOString();
    } else if (isExistingMatch && existingCompletedAt) {
      // Preserve existing completed_at if already set
      matchData.completed_at = existingCompletedAt;
    }
    // Don't include completed_at at all for new matches that aren't completed

    const { error } = await supabase
      .from('matches')
      .upsert(matchData, { onConflict: 'id' });

    if (error) {
      console.error('[saveMatchToDb] Database error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      if (error.message?.toLowerCase().includes('row-level security') ||
          error.code === '42501' ||
          error.code === 'PGRST301') {
        return {
          success: false,
          error: 'Save blocked by permissions. Please sign in again or check your connection.'
        };
      }

      return { success: false, error: error.message };
    }

    if (matchStatus === 'completed' && hasActivity && legalBalls > 0) {
      try {
        await updatePlayerStatsFromMatch(state);
      } catch (statError) {
        console.error('Error updating player stats:', statError);
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Exception saving match:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Load a specific match from Supabase
 */
export async function loadMatchFromDb(matchId: string): Promise<MatchState | null> {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('match_data, team_a_logo_url, team_b_logo_url')
      .eq('id', matchId)
      .maybeSingle();

    if (error) {
      console.error('Error loading match:', error);
      return null;
    }

    const state = data?.match_data as MatchState | null;

    // Migrate old matches: ensure totalBalls field exists
    if (state) {
      // Load team logos from database columns
      if (data?.team_a_logo_url) {
        state.teamALogo = data.team_a_logo_url;
      }
      if (data?.team_b_logo_url) {
        state.teamBLogo = data.team_b_logo_url;
      }

      for (const inn of state.innings) {
        if (typeof inn.totalBalls !== 'number') {
          inn.totalBalls = inn.legalBalls || 0;
        }
        // Keep legalBalls in sync for backwards compatibility
        inn.legalBalls = inn.totalBalls;
      }

      // Backwards compatibility: default to 20 overs if oversLimit is missing
      if (state.oversLimit === undefined || state.oversLimit === null) {
        state.oversLimit = 20;
      }

      // Ensure innings also have oversLimit set
      for (const inn of state.innings) {
        if (inn.oversLimit === undefined || inn.oversLimit === null) {
          inn.oversLimit = state.oversLimit;
        }
      }
    }

    return state;
  } catch (err) {
    console.error('Exception loading match:', err);
    return null;
  }
}

/**
 * List all matches for the current user (excludes deleted matches)
 */
export async function listMatchesFromDb(): Promise<MatchSummary[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('[listMatchesFromDb] No user authenticated');
      return [];
    }

    console.log('[listMatchesFromDb] Fetching matches for user:', user.id);

    // Defensive query: only apply filters if columns exist
    let query = supabase
      .from('matches')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('[listMatchesFromDb] Error listing matches:', error);
      throw new Error(`Failed to load matches: ${error.message}`);
    }

    console.log('[listMatchesFromDb] Raw matches received:', data?.length || 0);

    // Filter out deleted and abandoned matches defensively
    const filtered = (data || []).filter((match: any) => {
      const status = match.status || 'draft';
      const deletedAt = match.deleted_at;

      if (deletedAt) return false;
      if (status === 'abandoned' || status === 'deleted') return false;

      return true;
    });

    console.log('[listMatchesFromDb] Filtered matches:', filtered.length);

    return filtered.map((match: any) => {
      const matchData = match.match_data;

      // Migrate old matches: ensure totalBalls field exists
      if (matchData && matchData.innings) {
        for (const inn of matchData.innings) {
          if (typeof inn.totalBalls !== 'number') {
            inn.totalBalls = inn.legalBalls || 0;
          }
          inn.legalBalls = inn.totalBalls;
        }
      }

      // Load team logos from database columns into match data
      if (matchData) {
        if (match.team_a_logo_url) {
          matchData.teamALogo = match.team_a_logo_url;
        }
        if (match.team_b_logo_url) {
          matchData.teamBLogo = match.team_b_logo_url;
        }
      }

      return {
        id: match.id,
        userId: match.user_id,
        matchType: match.match_type,
        teamAName: match.team_a_name,
        teamBName: match.team_b_name,
        teamALogoUrl: match.team_a_logo_url || null,
        teamBLogoUrl: match.team_b_logo_url || null,
        status: match.status || 'draft',
        format: match.format,
        matchData: matchData,
        allowPlayerStatsView: match.allow_player_stats_view || false,
        allowTeamScorecardView: match.allow_team_scorecard_view || false,
        createdAt: match.created_at,
        updatedAt: match.updated_at,
        completedAt: match.completed_at || null,
      };
    });
  } catch (err) {
    console.error('Exception listing matches:', err);
    return [];
  }
}

/**
 * List matches (optimized) - Fetches only summary fields without heavy match_data payload
 * Use this for My Matches list to improve performance
 */
export async function listMatchSummariesFromDb(limit: number = 20, offset: number = 0): Promise<MatchListSummary[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('[listMatchSummariesFromDb] No user authenticated');
      return [];
    }

    console.log('[listMatchSummariesFromDb] Fetching match summaries for user:', user.id, { limit, offset });

    const { data, error } = await supabase
      .from('matches')
      .select('id, user_id, match_type, team_a_name, team_b_name, team_a_logo_url, team_b_logo_url, status, format, created_at, updated_at, completed_at')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[listMatchSummariesFromDb] Error listing match summaries:', error);
      throw new Error(`Failed to load matches: ${error.message}`);
    }

    console.log('[listMatchSummariesFromDb] Summaries received:', data?.length || 0);

    const filtered = (data || []).filter((match: any) => {
      const status = match.status || 'draft';
      if (status === 'abandoned' || status === 'deleted') return false;
      return true;
    });

    return filtered.map((match: any) => ({
      id: match.id,
      userId: match.user_id,
      matchType: match.match_type,
      teamAName: match.team_a_name,
      teamBName: match.team_b_name,
      teamALogoUrl: match.team_a_logo_url || null,
      teamBLogoUrl: match.team_b_logo_url || null,
      status: match.status || 'draft',
      format: match.format,
      createdAt: match.created_at,
      updatedAt: match.updated_at,
      completedAt: match.completed_at || null,
    }));
  } catch (err) {
    console.error('Exception listing match summaries:', err);
    return [];
  }
}

/**
 * Delete a match from Supabase (soft delete)
 */
export async function deleteMatchFromDb(matchId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[deleteMatchFromDb] Attempting to delete match:', matchId);

    const { error } = await supabase
      .from('matches')
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString(),
      })
      .eq('id', matchId);

    if (error) {
      console.error('[deleteMatchFromDb] Database error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return { success: false, error: error.message };
    }

    console.log('[deleteMatchFromDb] Successfully deleted match:', matchId);
    return { success: true };
  } catch (err) {
    console.error('[deleteMatchFromDb] Exception deleting match:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Create a new match in the database
 */
export async function createNewMatchInDb(
  state: MatchState,
  leagueId?: string,
  fixtureId?: string
): Promise<{ success: boolean; matchId?: string; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      console.warn('[createNewMatchInDb] No authenticated session found');
      return { success: false, error: 'Please sign in to create matches' };
    }

    const matchId = crypto.randomUUID();

    // First save the match
    const result = await saveMatchToDb(matchId, state);

    // If league/fixture info provided, update the match to include it
    if (result.success && (leagueId || fixtureId)) {
      const { error: updateError } = await supabase
        .from('matches')
        .update({
          league_id: leagueId || null,
          fixture_id: fixtureId || null,
        })
        .eq('id', matchId);

      if (updateError) {
        console.error('Error updating match with league/fixture info:', updateError);
      }

      // Update fixture status to IN_PROGRESS
      if (fixtureId) {
        await supabase
          .from('league_fixtures')
          .update({ status: 'IN_PROGRESS' })
          .eq('id', fixtureId);
      }
    }

    if (result.success) {
      return { success: true, matchId };
    } else {
      return { success: false, error: result.error };
    }
  } catch (err) {
    console.error('Exception creating match:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Update match visibility settings
 */
export async function updateMatchVisibility(
  matchId: string,
  allowPlayerStatsView: boolean,
  allowTeamScorecardView: boolean,
  isPublic?: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {
      allow_player_stats_view: allowPlayerStatsView,
      allow_team_scorecard_view: allowTeamScorecardView,
    };

    if (isPublic !== undefined) {
      updateData.is_public = isPublic;
    }

    const { error } = await supabase
      .from('matches')
      .update(updateData)
      .eq('id', matchId);

    if (error) {
      console.error('Error updating match visibility:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Exception updating match visibility:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * List completed matches for stats calculation
 * Only includes matches that are completed, not deleted, and have legal balls
 */
export async function listCompletedMatchesForStats(userId: string): Promise<MatchSummary[]> {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .is('deleted_at', null)
      .gt('legal_balls', 0)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error listing completed matches for stats:', error);
      return [];
    }

    return (data || []).map((match: any) => {
      const matchData = match.match_data;

      if (matchData && matchData.innings) {
        for (const inn of matchData.innings) {
          if (typeof inn.totalBalls !== 'number') {
            inn.totalBalls = inn.legalBalls || 0;
          }
          inn.legalBalls = inn.totalBalls;
        }
      }

      // Load team logos from database columns into match data
      if (matchData) {
        if (match.team_a_logo_url) {
          matchData.teamALogo = match.team_a_logo_url;
        }
        if (match.team_b_logo_url) {
          matchData.teamBLogo = match.team_b_logo_url;
        }
      }

      return {
        id: match.id,
        userId: match.user_id,
        matchType: match.match_type,
        teamAName: match.team_a_name,
        teamBName: match.team_b_name,
        teamALogoUrl: match.team_a_logo_url || null,
        teamBLogoUrl: match.team_b_logo_url || null,
        status: match.status,
        format: match.format,
        matchData: matchData,
        allowPlayerStatsView: match.allow_player_stats_view || false,
        allowTeamScorecardView: match.allow_team_scorecard_view || false,
        createdAt: match.created_at,
        updatedAt: match.updated_at,
        completedAt: match.completed_at || null,
      };
    });
  } catch (err) {
    console.error('Exception listing completed matches for stats:', err);
    return [];
  }
}

/**
 * List matches where the current user is a linked player with visibility enabled
 */
export async function listMyParticipatingMatches(): Promise<MatchSummary[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data: profiles } = await supabase
      .from('player_profiles')
      .select('id, name')
      .eq('linked_user_id', user.id);

    if (!profiles || profiles.length === 0) {
      return [];
    }

    const profileIds = profiles.map((p) => p.id);

    const { data: allMatches, error } = await supabase
      .from('matches')
      .select('*')
      .eq('allow_player_stats_view', true)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error listing participating matches:', error);
      return [];
    }

    const matchesWithParticipation: MatchSummary[] = [];

    for (const match of allMatches || []) {
      const matchData = match.match_data as MatchState;

      let isParticipating = false;
      if (matchData && matchData.teamA && matchData.teamB) {
        const allPlayers = [
          ...(matchData.teamA.players || []),
          ...(matchData.teamB.players || []),
        ];

        for (const player of allPlayers) {
          if (player.profileId && profileIds.includes(player.profileId)) {
            isParticipating = true;
            break;
          }
        }
      }

      if (isParticipating) {
        if (matchData && matchData.innings) {
          for (const inn of matchData.innings) {
            if (typeof inn.totalBalls !== 'number') {
              inn.totalBalls = inn.legalBalls || 0;
            }
            inn.legalBalls = inn.totalBalls;
          }
        }

        // Load team logos from database columns into match data
        if (matchData) {
          if (match.team_a_logo_url) {
            matchData.teamALogo = match.team_a_logo_url;
          }
          if (match.team_b_logo_url) {
            matchData.teamBLogo = match.team_b_logo_url;
          }
        }

        matchesWithParticipation.push({
          id: match.id,
          userId: match.user_id,
          matchType: match.match_type,
          teamAName: match.team_a_name,
          teamBName: match.team_b_name,
          teamALogoUrl: match.team_a_logo_url || null,
          teamBLogoUrl: match.team_b_logo_url || null,
          status: match.status,
          format: match.format,
          matchData: matchData,
          allowPlayerStatsView: match.allow_player_stats_view || false,
          allowTeamScorecardView: match.allow_team_scorecard_view || false,
          createdAt: match.created_at,
          updatedAt: match.updated_at,
          completedAt: match.completed_at || null,
        });
      }
    }

    return matchesWithParticipation;
  } catch (err) {
    console.error('Exception listing participating matches:', err);
    return [];
  }
}
export const getLivePublicMatches = async () => {
  try {
    // Dev logging: Show Supabase project URL
    const supabaseUrl = supabase.supabaseUrl || 'unknown';
    const urlHost = supabaseUrl ? new URL(supabaseUrl).host : 'unknown';
    console.log('[getLivePublicMatches] Supabase URL host:', urlHost);
    console.log('[getLivePublicMatches] Fetching public matches...');

    const { data, error, count } = await supabase
      .from('matches')
      .select('id, status, is_public, match_type, team_a_name, team_b_name, format, match_data, updated_at, created_at', { count: 'exact' })
      .eq('is_public', true)
      .is('deleted_at', null)
      .in('status', ['live', 'draft', 'completed', 'upcoming'])
      .order('updated_at', { ascending: false })
      .limit(20);

    // Dev logging: Show query results count
    console.log('[getLivePublicMatches] Query result count:', count);

    if (error) {
      console.error('[getLivePublicMatches] Database error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        supabaseUrl: urlHost
      });
      return [];
    }

    if (!data || data.length === 0) {
      console.log('[getLivePublicMatches] No public matches found. Query returned 0 rows.');
      console.log('[getLivePublicMatches] Filters applied: is_public=true, deleted_at=null, status IN (live,draft,completed,upcoming)');
      return [];
    }

    console.log('[getLivePublicMatches] Found', data.length, 'public matches:',
      data.map(m => ({ id: m.id, status: m.status, is_public: m.is_public, teamA: m.team_a_name, teamB: m.team_b_name })));

    // Transform to match the expected format for PublicHomePage
    const matches = data.map(match => {
      const matchData = match.match_data as any;
      const isLive = match.status === 'live';
      const isUpcoming = match.status === 'draft' || match.status === 'upcoming';
      const isCompleted = match.status === 'completed';

      // Calculate scores from innings data
      let teamAScore = 0;
      let teamBScore = 0;
      let teamAWickets = 0;
      let teamBWickets = 0;
      let overs = '0.0';

      if (matchData?.innings && matchData.innings.length > 0) {
        // Get scores for each team from their batting innings
        matchData.innings.forEach((inning: any, idx: number) => {
          if (inning.battingTeam === 'A') {
            teamAScore = inning.totalRuns || 0;
            teamAWickets = inning.wickets || 0;
            if (idx === matchData.currentInnings) {
              const totalBalls = inning.totalBalls || 0;
              const oversNum = Math.floor(totalBalls / 6);
              const balls = totalBalls % 6;
              overs = `${oversNum}.${balls}`;
            }
          } else if (inning.battingTeam === 'B') {
            teamBScore = inning.totalRuns || 0;
            teamBWickets = inning.wickets || 0;
            if (idx === matchData.currentInnings) {
              const totalBalls = inning.totalBalls || 0;
              const oversNum = Math.floor(totalBalls / 6);
              const balls = totalBalls % 6;
              overs = `${oversNum}.${balls}`;
            }
          }
        });
      }

      return {
        id: match.id,
        teamA: match.team_a_name,
        teamB: match.team_b_name,
        status: isLive ? 'live' : isUpcoming ? 'upcoming' : 'completed',
        scoreA: isLive || isCompleted ? `${teamAScore}/${teamAWickets}` : undefined,
        scoreB: (isLive || isCompleted) && teamBScore > 0 ? `${teamBScore}/${teamBWickets}` : undefined,
        overs: isLive ? overs : undefined,
        format: match.format,
        result: isCompleted ? matchData?.result : undefined,
        startTime: isUpcoming ? new Date(match.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        venue: matchData?.matchLocation || matchData?.venue || 'TBC',
        lastUpdated: new Date(match.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    });

    console.log('[getLivePublicMatches] Transformed matches:',
      matches.map(m => ({ id: m.id, status: m.status, scoreA: m.scoreA, scoreB: m.scoreB })));

    return matches;
  } catch (err) {
    console.error('[getLivePublicMatches] Exception:', err);
    return [];
  }
};

/**
 * Get a single public match by ID (for public match viewer)
 */
export const getPublicMatchById = async (matchId: string) => {
  try {
    // Dev logging: Show Supabase URL
    const supabaseUrl = supabase.supabaseUrl || 'unknown';
    const urlHost = supabaseUrl ? new URL(supabaseUrl).host : 'unknown';
    console.log('[getPublicMatchById] Supabase URL host:', urlHost);
    console.log('[getPublicMatchById] Fetching match:', matchId);
    console.log('[getPublicMatchById] Filters: id=' + matchId + ', is_public=true, deleted_at=null');

    const { data, error } = await supabase
      .from('matches')
      .select('id, status, is_public, match_type, team_a_name, team_b_name, format, match_data, updated_at, created_at')
      .eq('id', matchId)
      .eq('is_public', true)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      console.error('[getPublicMatchById] Database error:', {
        matchId,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        supabaseUrl: urlHost
      });
      return null;
    }

    if (!data) {
      console.log('[getPublicMatchById] Match not found or not public:', matchId);
      console.log('[getPublicMatchById] Possible reasons: 1) Match ID does not exist, 2) is_public=false, 3) deleted_at is not null');
      return null;
    }

    console.log('[getPublicMatchById] Found match:', {
      id: data.id,
      status: data.status,
      is_public: data.is_public,
      teamA: data.team_a_name,
      teamB: data.team_b_name
    });

    const matchData = data.match_data as any;
    const isLive = data.status === 'live';
    const isUpcoming = data.status === 'draft' || data.status === 'upcoming';
    const isCompleted = data.status === 'completed';

    // Build innings array with scores
    const innings = [];
    if (matchData?.innings && matchData.innings.length > 0) {
      matchData.innings.forEach((inning: any) => {
        innings.push({
          battingTeam: inning.battingTeam === 'A' ? data.team_a_name : data.team_b_name,
          runs: inning.totalRuns || 0,
          wickets: inning.wickets || 0,
          overs: Math.floor((inning.totalBalls || 0) / 6),
          balls: (inning.totalBalls || 0) % 6
        });
      });
    }

    // Build current batsmen array
    const currentBatsmen = [];
    if (isLive && matchData?.innings && matchData.innings[matchData.currentInnings]) {
      const currentInning = matchData.innings[matchData.currentInnings];
      const battingTeamPlayers = matchData.currentInnings === 0 ? matchData.teamAPlayers : matchData.teamBPlayers;

      if (currentInning.currentBatsmanIndex !== undefined && battingTeamPlayers[currentInning.currentBatsmanIndex]) {
        const striker = battingTeamPlayers[currentInning.currentBatsmanIndex];
        currentBatsmen.push({
          name: striker.name,
          runs: striker.runs || 0,
          balls: striker.balls || 0
        });
      }

      if (currentInning.currentNonStrikerIndex !== undefined && battingTeamPlayers[currentInning.currentNonStrikerIndex]) {
        const nonStriker = battingTeamPlayers[currentInning.currentNonStrikerIndex];
        currentBatsmen.push({
          name: nonStriker.name,
          runs: nonStriker.runs || 0,
          balls: nonStriker.balls || 0
        });
      }
    }

    // Build current bowler
    let currentBowler = null;
    if (isLive && matchData?.innings && matchData.innings[matchData.currentInnings]) {
      const currentInning = matchData.innings[matchData.currentInnings];
      const bowlingTeamPlayers = matchData.currentInnings === 0 ? matchData.teamBPlayers : matchData.teamAPlayers;

      if (currentInning.currentBowlerIndex !== undefined && bowlingTeamPlayers[currentInning.currentBowlerIndex]) {
        const bowler = bowlingTeamPlayers[currentInning.currentBowlerIndex];
        const totalBalls = bowler.ballsBowled || 0;
        const overs = Math.floor(totalBalls / 6);
        const balls = totalBalls % 6;
        const oversFormatted = balls > 0 ? `${overs}.${balls}` : `${overs}`;

        currentBowler = {
          name: bowler.name,
          overs: oversFormatted,
          runs: bowler.runsConceded || 0,
          wickets: bowler.wickets || 0
        };
      }
    }

    // Build last 6 balls
    const lastSixBalls = [];
    if (isLive && matchData?.innings && matchData.innings[matchData.currentInnings]) {
      const currentInning = matchData.innings[matchData.currentInnings];
      const deliveries = currentInning.deliveries || [];
      const legalDeliveries = deliveries.filter((d: any) => d.isLegal);
      const recentBalls = legalDeliveries.slice(-6);

      recentBalls.forEach((delivery: any) => {
        lastSixBalls.push({
          runs: delivery.runs || 0,
          isWicket: delivery.isWicket || false,
          isWide: delivery.isWide || false,
          isNoBall: delivery.isNoBall || false
        });
      });
    }

    return {
      id: data.id,
      teamA: data.team_a_name,
      teamB: data.team_b_name,
      status: isLive ? 'live' : isUpcoming ? 'upcoming' : 'completed',
      format: data.format,
      currentInnings: matchData?.currentInnings || 0,
      innings,
      currentBatsmen: currentBatsmen.length > 0 ? currentBatsmen : null,
      currentBowler,
      lastSixBalls: lastSixBalls.length > 0 ? lastSixBalls : null,
      result: isCompleted ? matchData?.result : undefined,
      lastUpdated: new Date(data.updated_at).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  } catch (err) {
    console.error('[getPublicMatchById] Exception:', err);
    return null;
  }
};
