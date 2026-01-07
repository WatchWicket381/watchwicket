import { PlayerCareerStats, RecentMatchEntry } from "../types/playerProfile";
import { listMatches, loadMatch } from "../store/matches";
import { MatchState, Player, BowlerStats, Inning } from "../matchTypes";

export function getBowlerStats(inning: Inning, bowlers: Player[]): Map<string, BowlerStats> {
  const bowlerStatsMap = new Map<string, BowlerStats>();

  for (const delivery of inning.deliveries) {
    if (!delivery.bowlerId) continue;

    if (!bowlerStatsMap.has(delivery.bowlerId)) {
      bowlerStatsMap.set(delivery.bowlerId, {
        playerId: delivery.bowlerId,
        overs: 0,
        balls: 0,
        maidens: 0,
        runsConceded: 0,
        wickets: 0,
        wides: 0,
        noballs: 0,
      });
    }

    const stats = bowlerStatsMap.get(delivery.bowlerId)!;

    if (delivery.isLegal) {
      stats.balls++;
    }

    stats.runsConceded += delivery.runs;

    if (delivery.isWicket) {
      stats.wickets++;
    }

    if (delivery.extraType === "wide") {
      stats.wides++;
    } else if (delivery.extraType === "noball") {
      stats.noballs++;
    }
  }

  return bowlerStatsMap;
}

export function getPlayerCareerStats(profileId: string): PlayerCareerStats {
  const matches = listMatches();

  const stats: PlayerCareerStats = {
    batting: {
      matches: 0,
      innings: 0,
      notOuts: 0,
      runs: 0,
      balls: 0,
      highest: 0,
      fifties: 0,
      hundreds: 0,
      fours: 0,
      sixes: 0,
      average: 0,
      strikeRate: 0,
    },
    bowling: {
      matches: 0,
      overs: 0,
      balls: 0,
      runs: 0,
      wickets: 0,
      bestWickets: 0,
      bestRuns: 999,
      economy: 0,
      fourW: 0,
      fiveW: 0,
    },
    fielding: {
      catches: 0,
      stumpings: 0,
      runOuts: 0,
    },
    recent: [],
  };

  const recentMatches: RecentMatchEntry[] = [];
  const matchesWithPlayer = new Set<string>();

  for (const matchSummary of matches) {
    const matchState = loadMatch(matchSummary.id);
    if (!matchState) continue;

    let playerAppeared = false;
    let battingStats: { runs: number; balls: number; dismissal?: string | null } | null = null;
    let bowlingStats: { overs: number; runs: number; wickets: number } | null = null;

    const allPlayers = [...matchState.teamAPlayers, ...matchState.teamBPlayers];
    const player = allPlayers.find(p => p.profileId === profileId);

    if (player) {
      playerAppeared = true;

      if (player.balls > 0 || player.runs > 0) {
        stats.batting.innings++;
        stats.batting.runs += player.runs;
        stats.batting.balls += player.balls;
        stats.batting.fours += player.fours;
        stats.batting.sixes += player.sixes;

        if (player.runs > stats.batting.highest) {
          stats.batting.highest = player.runs;
        }

        if (player.runs >= 50 && player.runs < 100) {
          stats.batting.fifties++;
        } else if (player.runs >= 100) {
          stats.batting.hundreds++;
        }

        if (!player.isOut) {
          stats.batting.notOuts++;
        }

        battingStats = {
          runs: player.runs,
          balls: player.balls,
          dismissal: player.dismissal,
        };
      }

      const bowlerStats = getBowlerStatsForPlayer(matchState, player.id);
      if (bowlerStats && bowlerStats.balls > 0) {
        stats.bowling.balls += bowlerStats.balls;
        stats.bowling.runs += bowlerStats.runsConceded;
        stats.bowling.wickets += bowlerStats.wickets;

        if (bowlerStats.wickets >= 4 && bowlerStats.wickets < 5) {
          stats.bowling.fourW++;
        } else if (bowlerStats.wickets >= 5) {
          stats.bowling.fiveW++;
        }

        if (bowlerStats.wickets > stats.bowling.bestWickets ||
            (bowlerStats.wickets === stats.bowling.bestWickets && bowlerStats.runsConceded < stats.bowling.bestRuns)) {
          stats.bowling.bestWickets = bowlerStats.wickets;
          stats.bowling.bestRuns = bowlerStats.runsConceded;
        }

        bowlingStats = {
          overs: Math.floor(bowlerStats.balls / 6) + (bowlerStats.balls % 6) / 10,
          runs: bowlerStats.runsConceded,
          wickets: bowlerStats.wickets,
        };
      }
    }

    if (playerAppeared) {
      matchesWithPlayer.add(matchSummary.id);

      const opponent = getOpponentName(matchState, player!);
      recentMatches.push({
        matchId: matchSummary.id,
        date: matchSummary.updatedAt,
        opponent,
        format: matchSummary.format,
        battingRuns: battingStats?.runs,
        battingBalls: battingStats?.balls,
        dismissal: battingStats?.dismissal,
        bowlingOvers: bowlingStats?.overs,
        bowlingRuns: bowlingStats?.runs,
        bowlingWickets: bowlingStats?.wickets,
      });
    }
  }

  stats.batting.matches = matchesWithPlayer.size;
  stats.bowling.matches = matchesWithPlayer.size;

  if (stats.batting.innings > 0) {
    const outs = stats.batting.innings - stats.batting.notOuts;
    stats.batting.average = outs > 0 ? stats.batting.runs / outs : stats.batting.runs;
  }

  if (stats.batting.balls > 0) {
    stats.batting.strikeRate = (stats.batting.runs / stats.batting.balls) * 100;
  }

  if (stats.bowling.balls > 0) {
    stats.bowling.overs = Math.floor(stats.bowling.balls / 6) + (stats.bowling.balls % 6) / 10;
    const totalOvers = stats.bowling.balls / 6;
    stats.bowling.economy = totalOvers > 0 ? stats.bowling.runs / totalOvers : 0;
  }

  recentMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  stats.recent = recentMatches.slice(0, 5);

  return stats;
}

function getBowlerStatsForPlayer(matchState: MatchState, playerId: string): BowlerStats | null {
  for (const inning of matchState.innings) {
    const bowlerStatsMap = new Map<string, BowlerStats>();

    for (const delivery of inning.deliveries) {
      if (!delivery.bowlerId) continue;

      if (!bowlerStatsMap.has(delivery.bowlerId)) {
        bowlerStatsMap.set(delivery.bowlerId, {
          playerId: delivery.bowlerId,
          overs: 0,
          balls: 0,
          maidens: 0,
          runsConceded: 0,
          wickets: 0,
          wides: 0,
          noballs: 0,
        });
      }

      const stats = bowlerStatsMap.get(delivery.bowlerId)!;

      if (delivery.isLegal) {
        stats.balls++;
      }

      stats.runsConceded += delivery.runs;

      if (delivery.isWicket) {
        stats.wickets++;
      }

      if (delivery.extraType === "wide") {
        stats.wides++;
      } else if (delivery.extraType === "noball") {
        stats.noballs++;
      }
    }

    if (bowlerStatsMap.has(playerId)) {
      return bowlerStatsMap.get(playerId)!;
    }
  }

  return null;
}

function getOpponentName(matchState: MatchState, player: Player): string {
  const isTeamA = matchState.teamAPlayers.some(p => p.id === player.id);
  return isTeamA ? matchState.teamBName : matchState.teamAName;
}
