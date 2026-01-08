import { MatchState, Player, Inning } from "../matchTypes";
import { getPlayerStats, updatePlayerStats } from "./supabasePlayerProfiles";

interface BowlerStats {
  balls: number;
  runs: number;
  wickets: number;
}

function calculateBowlerStats(inning: Inning, playerId: string): BowlerStats {
  let balls = 0;
  let runs = 0;
  let wickets = 0;

  for (const delivery of inning.deliveries) {
    if (delivery.bowlerId === playerId) {
      if (delivery.isLegal) {
        balls++;
      }
      runs += delivery.runs;
      if (delivery.isWicket) {
        wickets++;
      }
    }
  }

  return { balls, runs, wickets };
}

export async function updatePlayerStatsFromMatch(match: MatchState): Promise<void> {
  const legalBalls = match.innings.reduce((total, inning) => {
    return total + inning.deliveries.filter(d => d.isLegal).length;
  }, 0);

  if (match.status !== "completed" && match.status !== "Completed") {
    return;
  }

  if (!match.hasActivity || legalBalls === 0) {
    return;
  }

  const allPlayers = [...match.teamAPlayers, ...match.teamBPlayers];
  const playersWithProfiles = allPlayers.filter((p) => p.profileId);

  for (const player of playersWithProfiles) {
    try {
      await updateStatsForPlayer(player, match);
    } catch (error) {
      console.error(`Error updating stats for player ${player.name}:`, error);
    }
  }
}

async function updateStatsForPlayer(player: Player, match: MatchState): Promise<void> {
  if (!player.profileId) return;

  const format = match.format as "INDOOR" | "T20" | "ODI";

  const allStats = await getPlayerStats(player.profileId, "ALL");
  const formatStats = await getPlayerStats(player.profileId, format);

  if (!allStats || !formatStats) {
    console.error("Could not load stats for player", player.profileId);
    return;
  }

  let totalBowlingBalls = 0;
  let totalBowlingRuns = 0;
  let totalBowlingWickets = 0;

  for (const inning of match.innings) {
    const bowlerStats = calculateBowlerStats(inning, player.id);
    totalBowlingBalls += bowlerStats.balls;
    totalBowlingRuns += bowlerStats.runs;
    totalBowlingWickets += bowlerStats.wickets;
  }

  const battedInMatch = player.balls > 0 || player.runs > 0;
  const bowledInMatch = totalBowlingBalls > 0;

  const battingUpdates: any = {};
  const bowlingUpdates: any = {};

  if (battedInMatch) {
    battingUpdates.batting_matches = allStats.batting_matches + 1;
    battingUpdates.batting_innings = allStats.batting_innings + 1;
    battingUpdates.batting_runs = allStats.batting_runs + player.runs;
    battingUpdates.batting_balls = allStats.batting_balls + player.balls;
    battingUpdates.batting_fours = allStats.batting_fours + (player.fours || 0);
    battingUpdates.batting_sixes = allStats.batting_sixes + (player.sixes || 0);

    if (!player.isOut) {
      battingUpdates.batting_not_outs = allStats.batting_not_outs + 1;
    }

    if (player.runs > allStats.batting_highest) {
      battingUpdates.batting_highest = player.runs;
    }

    if (player.runs >= 50 && player.runs < 100) {
      battingUpdates.batting_fifties = allStats.batting_fifties + 1;
    } else if (player.runs >= 100) {
      battingUpdates.batting_hundreds = allStats.batting_hundreds + 1;
    }

    const totalInnings = battingUpdates.batting_innings;
    const totalRuns = battingUpdates.batting_runs;
    const totalBalls = battingUpdates.batting_balls;
    const totalNotOuts = battingUpdates.batting_not_outs;
    const outs = totalInnings - totalNotOuts;

    battingUpdates.batting_average = outs > 0 ? totalRuns / outs : totalRuns;
    battingUpdates.batting_strike_rate = totalBalls > 0 ? (totalRuns / totalBalls) * 100 : 0;
  }

  if (bowledInMatch) {
    bowlingUpdates.bowling_matches = allStats.bowling_matches + 1;
    bowlingUpdates.bowling_balls = allStats.bowling_balls + totalBowlingBalls;
    bowlingUpdates.bowling_runs = allStats.bowling_runs + totalBowlingRuns;
    bowlingUpdates.bowling_wickets = allStats.bowling_wickets + totalBowlingWickets;

    const totalBalls = bowlingUpdates.bowling_balls;
    const totalRuns = bowlingUpdates.bowling_runs;
    const totalOvers = totalBalls / 6;

    bowlingUpdates.bowling_overs = Math.floor(totalBalls / 6) + (totalBalls % 6) / 10;
    bowlingUpdates.bowling_economy = totalOvers > 0 ? totalRuns / totalOvers : 0;

    if (
      totalBowlingWickets > allStats.bowling_best_wickets ||
      (totalBowlingWickets === allStats.bowling_best_wickets &&
        totalBowlingRuns < allStats.bowling_best_runs)
    ) {
      bowlingUpdates.bowling_best_wickets = totalBowlingWickets;
      bowlingUpdates.bowling_best_runs = totalBowlingRuns;
    }

    if (totalBowlingWickets >= 4 && totalBowlingWickets < 5) {
      bowlingUpdates.bowling_four_w = allStats.bowling_four_w + 1;
    } else if (totalBowlingWickets >= 5) {
      bowlingUpdates.bowling_five_w = allStats.bowling_five_w + 1;
    }
  }

  await updatePlayerStats(player.profileId, "ALL", {
    ...battingUpdates,
    ...bowlingUpdates,
  });

  const formatBattingUpdates: any = {};
  const formatBowlingUpdates: any = {};

  if (battedInMatch) {
    formatBattingUpdates.batting_matches = formatStats.batting_matches + 1;
    formatBattingUpdates.batting_innings = formatStats.batting_innings + 1;
    formatBattingUpdates.batting_runs = formatStats.batting_runs + player.runs;
    formatBattingUpdates.batting_balls = formatStats.batting_balls + player.balls;
    formatBattingUpdates.batting_fours = formatStats.batting_fours + (player.fours || 0);
    formatBattingUpdates.batting_sixes = formatStats.batting_sixes + (player.sixes || 0);

    if (!player.isOut) {
      formatBattingUpdates.batting_not_outs = formatStats.batting_not_outs + 1;
    }

    if (player.runs > formatStats.batting_highest) {
      formatBattingUpdates.batting_highest = player.runs;
    }

    if (player.runs >= 50 && player.runs < 100) {
      formatBattingUpdates.batting_fifties = formatStats.batting_fifties + 1;
    } else if (player.runs >= 100) {
      formatBattingUpdates.batting_hundreds = formatStats.batting_hundreds + 1;
    }

    const totalInnings = formatBattingUpdates.batting_innings;
    const totalRuns = formatBattingUpdates.batting_runs;
    const totalBalls = formatBattingUpdates.batting_balls;
    const totalNotOuts = formatBattingUpdates.batting_not_outs;
    const outs = totalInnings - totalNotOuts;

    formatBattingUpdates.batting_average = outs > 0 ? totalRuns / outs : totalRuns;
    formatBattingUpdates.batting_strike_rate = totalBalls > 0 ? (totalRuns / totalBalls) * 100 : 0;
  }

  if (bowledInMatch) {
    formatBowlingUpdates.bowling_matches = formatStats.bowling_matches + 1;
    formatBowlingUpdates.bowling_balls = formatStats.bowling_balls + totalBowlingBalls;
    formatBowlingUpdates.bowling_runs = formatStats.bowling_runs + totalBowlingRuns;
    formatBowlingUpdates.bowling_wickets = formatStats.bowling_wickets + totalBowlingWickets;

    const totalBalls = formatBowlingUpdates.bowling_balls;
    const totalRuns = formatBowlingUpdates.bowling_runs;
    const totalOvers = totalBalls / 6;

    formatBowlingUpdates.bowling_overs = Math.floor(totalBalls / 6) + (totalBalls % 6) / 10;
    formatBowlingUpdates.bowling_economy = totalOvers > 0 ? totalRuns / totalOvers : 0;

    if (
      totalBowlingWickets > formatStats.bowling_best_wickets ||
      (totalBowlingWickets === formatStats.bowling_best_wickets &&
        totalBowlingRuns < formatStats.bowling_best_runs)
    ) {
      formatBowlingUpdates.bowling_best_wickets = totalBowlingWickets;
      formatBowlingUpdates.bowling_best_runs = totalBowlingRuns;
    }

    if (totalBowlingWickets >= 4 && totalBowlingWickets < 5) {
      formatBowlingUpdates.bowling_four_w = formatStats.bowling_four_w + 1;
    } else if (totalBowlingWickets >= 5) {
      formatBowlingUpdates.bowling_five_w = formatStats.bowling_five_w + 1;
    }
  }

  await updatePlayerStats(player.profileId, format, {
    ...formatBattingUpdates,
    ...formatBowlingUpdates,
  });
}
