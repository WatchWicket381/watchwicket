import { MatchState, MatchFormat, Inning, Delivery } from "../matchTypes";
import { formatPresets } from "../formatPresets";
import { clampOversToFormat } from "../utils/oversConstraints";
import { clampSquadSizeToFormat } from "../utils/squadConstraints";

export function createNewMatch(): MatchState {
  return {
    teamAName: "Team A",
    teamBName: "Team B",
    format: "INDOOR",
    inningsCount: 1,
    currentInnings: 0,
    innings: [
      {
        battingTeam: "A",
        bowlingTeam: "B",
        deliveries: [],
        totalRuns: 0,
        wickets: 0,
        totalBalls: 0,
        legalBalls: 0,
        completed: false,
        oversLimit: 18,
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
      },
    ],
    teamAPlayers: [],
    teamBPlayers: [],
    teamASubstitutes: [],
    teamBSubstitutes: [],
    squadSize: 10,
    teamACaptainId: null,
    teamBCaptainId: null,
    teamAKeeperId: null,
    teamBKeeperId: null,
    strikerId: null,
    nonStrikerId: null,
    bowlerId: null,
    oversLimit: 18,
    battingOrder: [],
    battingCycleDismissals: 0,
    battingOrderReversed: false,
    toss: {
      winnerTeam: null,
      decision: null,
    },
    commentary: [],
    matchLocation: "",
    matchDate: new Date().toISOString().split('T')[0],
    matchTime: new Date().toTimeString().slice(0, 5),
    hasActivity: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function applyFormat(state: MatchState, format: MatchFormat): void {
  const preset = formatPresets[format];
  state.oversLimit = preset.oversLimit;
  state.inningsCount = preset.inningsCount;

  state.oversLimit = clampOversToFormat(state.oversLimit, format);

  if (state.innings.length > 0) {
    state.innings[state.currentInnings].oversLimit = state.oversLimit;
  }

  state.squadSize = clampSquadSizeToFormat(state.squadSize, format);

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

  if (format === "INDOOR") {
    const inn = state.innings[state.currentInnings];
    const battingTeam = inn.battingTeam === "A" ? state.teamAPlayers : state.teamBPlayers;
    state.battingOrder = battingTeam.map(p => p.id);
    state.battingCycleDismissals = 0;
    state.battingOrderReversed = false;
  } else {
    state.battingOrder = [];
    state.battingCycleDismissals = 0;
    state.battingOrderReversed = false;
  }
}

export function currentInning(state: MatchState): Inning {
  return state.innings[state.currentInnings];
}

export function addDelivery(state: MatchState, delivery: Delivery): MatchState {
  if (!state.strikerId || !state.nonStrikerId || !state.bowlerId) {
    return state;
  }

  // Create a deep copy to avoid mutating the original state
  const newState = JSON.parse(JSON.stringify(state));
  newState.hasActivity = true;

  const inn = currentInning(newState);

  inn.deliveries.push(delivery);
  inn.totalRuns += delivery.runs;

  if (delivery.extraType === "wide") inn.extras.wides += 1;
  if (delivery.extraType === "noball") inn.extras.noBalls += 1;
  if (delivery.extraType === "bye") inn.extras.byes += 1;
  if (delivery.extraType === "legbye") inn.extras.legByes += 1;

  if (delivery.isLegal) {
    inn.totalBalls += 1;
    inn.legalBalls = inn.totalBalls;
  }

  if (delivery.isWicket) {
    inn.wickets += 1;

    if (newState.format === "INDOOR") {
      inn.totalRuns -= 3;
    }

    const battingTeam = inn.battingTeam === "A" ? newState.teamAPlayers : newState.teamBPlayers;
    const bowlingTeam = inn.battingTeam === "A" ? newState.teamBPlayers : newState.teamAPlayers;
    const batter = battingTeam.find(p => p.id === newState.strikerId);
    const bowler = bowlingTeam.find(p => p.id === newState.bowlerId);

    if (batter) {
      batter.dismissal = delivery.dismissal || "out";

      if (newState.format === "INDOOR") {
        batter.outsCount = (batter.outsCount || 0) + 1;
        // In Indoor Mode, mark as out temporarily but allow to bat again
        batter.isOut = true;
      } else {
        // In other modes, player is permanently out
        batter.isOut = true;
      }

      if (delivery.dismissalType) {
        const fielder = delivery.fielderId ? bowlingTeam.find(p => p.id === delivery.fielderId) : null;
        batter.dismissalDetails = {
          type: delivery.dismissalType,
          bowlerName: bowler?.name,
          fielderName: fielder?.name,
        };
      }
    }

    // Clear only the striker (dismissed batter), keep non-striker
    newState.strikerId = null;

    if (newState.format === "INDOOR") {
      newState.battingCycleDismissals += 1;

      // Check if all players have been dismissed at least once
      if (newState.battingCycleDismissals >= battingTeam.length) {
        newState.battingCycleDismissals = 0;
        // Reset all players to allow them to bat again
        battingTeam.forEach(p => {
          p.isOut = false;
        });
        // Keep the batting order the same - restart from beginning
        // Do NOT clear non-striker, only striker needs replacement
      }
    }
  }

  if (newState.strikerId && !delivery.isWicket) {
    const battingTeam = inn.battingTeam === "A" ? newState.teamAPlayers : newState.teamBPlayers;
    const batter = battingTeam.find(p => p.id === newState.strikerId);
    if (batter) {
      let batterRuns = delivery.runs;

      if (delivery.extraType === "noball" || delivery.extraType === "wide") {
        batterRuns = Math.max(0, delivery.runs - 1);
      } else if (delivery.extraType === "bye" || delivery.extraType === "legbye") {
        batterRuns = 0;
      }

      if (delivery.isLegal || delivery.extraType === "noball") {
        batter.runs += batterRuns;
        if (delivery.isLegal) {
          batter.balls += 1;
        }
        if (batterRuns === 4) batter.fours += 1;
        if (batterRuns === 6) batter.sixes += 1;
      }
    }
  }

  // Striker rotation: swap for odd runs (1, 3, 5)
  // Wall Bonus (W+1) credits 2 runs BUT rotates as if 1 run (ODD = swap strike)
  if ((delivery.isLegal || delivery.extraType === "noball") && !delivery.isWicket) {
    let runsForRotation = delivery.runsForRotation ?? delivery.runs;

    // Special case: W+1 credits 2 runs but rotates as if 1 run taken
    if (delivery.wallBonus) {
      runsForRotation = 1;
    } else if (delivery.extraType === "noball" || delivery.extraType === "wide") {
      runsForRotation = Math.max(0, delivery.runs - 1);
    }

    const shouldSwap = (runsForRotation === 1 || runsForRotation === 3 || runsForRotation === 5);
    if (shouldSwap) {
      const temp = newState.strikerId;
      newState.strikerId = newState.nonStrikerId;
      newState.nonStrikerId = temp;
    }
  }

  if (delivery.isLegal && inn.totalBalls % 6 === 0) {
    const temp = newState.strikerId;
    newState.strikerId = newState.nonStrikerId;
    newState.nonStrikerId = temp;
    newState.bowlerId = null;
  }

  // Auto-end innings only when overs limit is reached (not on wickets for Indoor)
  const currentLimit = newState.innings[newState.currentInnings].oversLimit;
  if (currentLimit !== null && inn.totalBalls >= currentLimit * 6) {
    inn.completed = true;

    // Auto-start next innings if this isn't the last innings
    if (newState.currentInnings + 1 < newState.inningsCount && !newState.innings[newState.currentInnings + 1]) {
      // Need to start next innings
      const newBattingTeam = inn.bowlingTeam;
      const newBowlingTeam = inn.battingTeam;
      const targetValue = inn.totalRuns + 1;

      newState.innings.push({
        battingTeam: newBattingTeam,
        bowlingTeam: newBowlingTeam,
        deliveries: [],
        totalRuns: 0,
        wickets: 0,
        totalBalls: 0,
        legalBalls: 0,
        completed: false,
        oversLimit: newState.oversLimit,
        target: targetValue,
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
      });
    }
  }

  // Check if 2nd innings target is reached (for T20/ODI)
  if (newState.format !== "INDOOR" && inn.target && inn.totalRuns >= inn.target) {
    inn.completed = true;
  }

  // In non-Indoor modes, auto-end innings if all wickets are down
  if (newState.format !== "INDOOR") {
    const battingTeam = inn.battingTeam === "A" ? newState.teamAPlayers : newState.teamBPlayers;
    const playersOut = battingTeam.filter(p => p.isOut).length;
    if (playersOut >= battingTeam.length - 1) {
      inn.completed = true;
    }
  }

  newState.updatedAt = new Date().toISOString();
  return newState;
}

export function setNextBatter(state: MatchState, playerId: string): MatchState {
  const newState = JSON.parse(JSON.stringify(state));
  if (!newState.strikerId) {
    newState.strikerId = playerId;
  } else if (!newState.nonStrikerId) {
    newState.nonStrikerId = playerId;
  }
  newState.updatedAt = new Date().toISOString();
  return newState;
}

export function setNextBowler(state: MatchState, playerId: string): MatchState {
  const newState = JSON.parse(JSON.stringify(state));
  newState.bowlerId = playerId;
  newState.updatedAt = new Date().toISOString();
  return newState;
}

export function endInnings(state: MatchState): void {
  const inn = currentInning(state);
  inn.completed = true;
  state.updatedAt = new Date().toISOString();
}

export function startNextInnings(state: MatchState): void {
  const inn = currentInning(state);

  if (state.currentInnings + 1 < state.inningsCount) {
    state.currentInnings += 1;

    const prevInning = state.innings[state.currentInnings - 1];
    const newBattingTeam = prevInning.bowlingTeam;
    const newBowlingTeam = prevInning.battingTeam;

    // Indoor mode sets target as first innings score (not +1)
    const targetValue = prevInning.totalRuns + 1;

    state.innings.push({
      battingTeam: newBattingTeam,
      bowlingTeam: newBowlingTeam,
      deliveries: [],
      totalRuns: 0,
      wickets: 0,
      totalBalls: 0,
      legalBalls: 0,
      completed: false,
      target: targetValue,
      oversLimit: prevInning.oversLimit,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
    });

    state.strikerId = null;
    state.nonStrikerId = null;
    state.bowlerId = null;

    // Reset player stats for new innings
    const battingTeam = newBattingTeam === "A" ? state.teamAPlayers : state.teamBPlayers;
    battingTeam.forEach(p => {
      p.runs = 0;
      p.balls = 0;
      p.fours = 0;
      p.sixes = 0;
      p.isOut = false;
      p.dismissal = null;
      p.dismissalDetails = undefined;
      if (state.format === "INDOOR") {
        p.outsCount = 0;
      }
    });

    if (state.format === "INDOOR") {
      state.battingOrder = battingTeam.map(p => p.id);
      state.battingCycleDismissals = 0;
      state.battingOrderReversed = false;
    }
  }

  state.updatedAt = new Date().toISOString();
}

export function getMatchResult(state: MatchState): string | null {
  if (state.currentInnings === 0) return null;
  if (state.currentInnings === 1 && state.innings.length < 2) return null;

  const firstInnings = state.innings[0];
  const secondInnings = state.innings[1];

  if (!secondInnings || !secondInnings.completed) return null;

  const firstTeamName = firstInnings.battingTeam === "A" ? state.teamAName : state.teamBName;
  const secondTeamName = secondInnings.battingTeam === "A" ? state.teamAName : state.teamBName;

  if (secondInnings.totalRuns > firstInnings.totalRuns) {
    const wicketsRemaining = state.teamAPlayers.length - secondInnings.wickets;
    const ballsRemaining = (secondInnings.oversLimit || 0) * 6 - secondInnings.totalBalls;
    return `${secondTeamName} won by ${wicketsRemaining} wickets (${ballsRemaining} balls remaining)`;
  } else if (firstInnings.totalRuns > secondInnings.totalRuns) {
    const runDifference = firstInnings.totalRuns - secondInnings.totalRuns;
    return `${firstTeamName} won by ${runDifference} runs`;
  } else {
    return "Match tied";
  }
}

export function applyToss(state: MatchState, winner: "A" | "B", decision: "BAT" | "BOWL"): void {
  state.toss = { winnerTeam: winner, decision };

  const battingTeam = decision === "BAT" ? winner : (winner === "A" ? "B" : "A");
  const bowlingTeam = battingTeam === "A" ? "B" : "A";

  if (state.innings[0]) {
    state.innings[0].battingTeam = battingTeam;
    state.innings[0].bowlingTeam = bowlingTeam;
  }

  if (state.format === "INDOOR") {
    const battingPlayers = battingTeam === "A" ? state.teamAPlayers : state.teamBPlayers;
    state.battingOrder = battingPlayers.map(p => p.id);
    state.battingCycleDismissals = 0;
    state.battingOrderReversed = false;
  }

  state.updatedAt = new Date().toISOString();
}

export function getCurrentRunRate(inn: Inning): number {
  if (inn.totalBalls === 0) return 0;
  const overs = inn.totalBalls / 6;
  return inn.totalRuns / overs;
}

export function getRequiredRunRate(inn: Inning): number | null {
  if (!inn.target || !inn.oversLimit) return null;
  const remainingRuns = inn.target - inn.totalRuns;
  const remainingBalls = (inn.oversLimit * 6) - inn.totalBalls;
  if (remainingBalls <= 0) return null;
  const remainingOvers = remainingBalls / 6;
  return remainingRuns / remainingOvers;
}

export function getOversDisplay(totalBalls: number): string {
  const overs = Math.floor(totalBalls / 6);
  const balls = totalBalls % 6;
  return `${overs}.${balls}`;
}

export function getPartnership(state: MatchState): { runs: number; balls: number } {
  const inn = currentInning(state);
  const striker = state.strikerId;
  const nonStriker = state.nonStrikerId;

  if (!striker || !nonStriker) {
    return { runs: 0, balls: 0 };
  }

  let partnershipRuns = 0;
  let partnershipBalls = 0;
  let currentStriker = striker;
  let currentNonStriker = nonStriker;

  for (let i = inn.deliveries.length - 1; i >= 0; i--) {
    const del = inn.deliveries[i];

    if (del.isWicket) break;

    if (del.isLegal) {
      partnershipRuns += del.runs;
      partnershipBalls += 1;

      if (del.runs === 1 || del.runs === 3 || del.runs === 5) {
        const temp = currentStriker;
        currentStriker = currentNonStriker;
        currentNonStriker = temp;
      }

      if (partnershipBalls % 6 === 0) {
        const temp = currentStriker;
        currentStriker = currentNonStriker;
        currentNonStriker = temp;
      }
    }

    if ((currentStriker !== striker || currentNonStriker !== nonStriker) &&
        (currentStriker !== nonStriker || currentNonStriker !== striker)) {
      break;
    }
  }

  return { runs: partnershipRuns, balls: partnershipBalls };
}

export function getProjectedScore(inn: Inning): number | null {
  if (!inn.oversLimit || inn.totalBalls === 0) return null;
  const crr = getCurrentRunRate(inn);
  return Math.round(crr * inn.oversLimit);
}

export function undoLastDelivery(state: MatchState): MatchState {
  const inn = currentInning(state);

  if (inn.deliveries.length === 0) {
    return state;
  }

  const lastDelivery = inn.deliveries[inn.deliveries.length - 1];

  inn.totalRuns -= lastDelivery.runs;

  if (lastDelivery.extraType === "wide") inn.extras.wides -= 1;
  if (lastDelivery.extraType === "noball") inn.extras.noBalls -= 1;
  if (lastDelivery.extraType === "bye") inn.extras.byes -= 1;
  if (lastDelivery.extraType === "legbye") inn.extras.legByes -= 1;

  if (lastDelivery.isLegal) {
    inn.totalBalls -= 1;
    inn.legalBalls = inn.totalBalls;
  }

  if (lastDelivery.isWicket) {
    inn.wickets -= 1;

    if (state.format === "INDOOR") {
      inn.totalRuns += 3;
    }

    const battingTeam = inn.battingTeam === "A" ? state.teamAPlayers : state.teamBPlayers;
    const batter = battingTeam.find(p => p.id === lastDelivery.batterId);
    if (batter) {
      batter.isOut = false;
      batter.dismissal = null;

      if (state.format === "INDOOR" && batter.outsCount && batter.outsCount > 0) {
        batter.outsCount -= 1;
      }
    }
  }

  if (lastDelivery.isLegal && lastDelivery.batterId) {
    const battingTeam = inn.battingTeam === "A" ? state.teamAPlayers : state.teamBPlayers;
    const batter = battingTeam.find(p => p.id === lastDelivery.batterId);
    if (batter) {
      batter.runs -= lastDelivery.runs;
      batter.balls -= 1;
      if (lastDelivery.runs === 4) batter.fours -= 1;
      if (lastDelivery.runs === 6) batter.sixes -= 1;
    }
  }

  inn.deliveries.pop();

  state.updatedAt = new Date().toISOString();
  return { ...state };
}
