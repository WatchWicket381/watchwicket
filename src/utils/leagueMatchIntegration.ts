import { MatchState } from "../matchTypes";
import { updateFixture, updateLeagueStandings } from "../store/leagues";

/**
 * Determines the result of a completed match
 */
export function determineMatchResult(state: MatchState): {
  homeWon: boolean;
  awayWon: boolean;
  tied: boolean;
  noResult: boolean;
  homeScore: number;
  awayScore: number;
  homeOvers: number;
  awayOvers: number;
} {
  const innings1 = state.innings[0];
  const innings2 = state.innings[1];

  const homeScore = innings1?.totalRuns || 0;
  const awayScore = innings2?.totalRuns || 0;

  const homeOvers = innings1 ? (innings1.totalBalls || 0) / 6 : 0;
  const awayOvers = innings2 ? (innings2.totalBalls || 0) / 6 : 0;

  const noResult = state.status !== 'Completed';
  const tied = homeScore === awayScore && state.status === 'Completed';
  const homeWon = homeScore > awayScore && state.status === 'Completed';
  const awayWon = awayScore > homeScore && state.status === 'Completed';

  return {
    homeWon,
    awayWon,
    tied,
    noResult,
    homeScore,
    awayScore,
    homeOvers,
    awayOvers,
  };
}

/**
 * Updates league standings and fixture status after a league match is completed
 */
export async function updateLeagueAfterMatch(
  matchState: MatchState,
  leagueId: string,
  fixtureId: string,
  homeTeamId: string,
  awayTeamId: string,
  matchId: string
): Promise<boolean> {
  try {
    const result = determineMatchResult(matchState);

    // Update fixture status
    await updateFixture(fixtureId, {
      status: "COMPLETED",
      match_id: matchId,
    });

    // Update standings for home team
    await updateLeagueStandings(leagueId, homeTeamId, {
      won: result.homeWon,
      tied: result.tied,
      noResult: result.noResult,
      runsScored: result.homeScore,
      runsConceded: result.awayScore,
      oversFaced: result.homeOvers,
      oversBowled: result.awayOvers,
    });

    // Update standings for away team
    await updateLeagueStandings(leagueId, awayTeamId, {
      won: result.awayWon,
      tied: result.tied,
      noResult: result.noResult,
      runsScored: result.awayScore,
      runsConceded: result.homeScore,
      oversFaced: result.awayOvers,
      oversBowled: result.homeOvers,
    });

    return true;
  } catch (error) {
    console.error("Error updating league after match:", error);
    return false;
  }
}
