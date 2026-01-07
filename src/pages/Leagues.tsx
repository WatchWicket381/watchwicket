import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  listLeagues,
  getLeagueStandings,
  getLeagueFixtures,
  createLeague,
  deleteLeague,
  getLeagueTeams,
  addTeamToLeague,
  removeTeamFromLeague,
  League,
  LeagueStanding,
  LeagueFixture,
  LeagueTeam,
} from "../store/leagues";
import { supabase } from "../supabaseClient";
import { listMatchesFromDb, MatchSummary as MatchSummaryType } from "../store/supabaseMatches";

interface LeaguesProps {
  onClose: () => void;
  onStartMatchFromFixture?: (fixture: LeagueFixture, league: League) => void;
  onViewMatch?: (matchId: string) => void;
}

type TabView = "table" | "fixtures" | "results" | "teams";

export default function Leagues({ onClose, onStartMatchFromFixture, onViewMatch }: LeaguesProps) {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [currentTab, setCurrentTab] = useState<TabView>("table");
  const [standings, setStandings] = useState<LeagueStanding[]>([]);
  const [fixtures, setFixtures] = useState<LeagueFixture[]>([]);
  const [leagueTeams, setLeagueTeams] = useState<LeagueTeam[]>([]);
  const [teamNames, setTeamNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showCreateLeague, setShowCreateLeague] = useState(false);
  const [showCreateFixture, setShowCreateFixture] = useState(false);
  const [showAddTeam, setShowAddTeam] = useState(false);

  useEffect(() => {
    loadLeagues();
  }, []);

  useEffect(() => {
    if (selectedLeague) {
      loadLeagueData();
    }
  }, [selectedLeague, currentTab]);

  async function loadLeagues() {
    setLoading(true);
    const data = await listLeagues();
    setLeagues(data);
    if (data.length > 0 && !selectedLeague) {
      setSelectedLeague(data[0]);
    }
    setLoading(false);
  }

  async function loadLeagueData() {
    if (!selectedLeague) return;

    if (currentTab === "table") {
      const standingsData = await getLeagueStandings(selectedLeague.id);
      const names = await loadTeamNamesMap();
      setTeamNames(names);
      const standingsWithNames = standingsData.map((s) => ({
        ...s,
        team_name: names.get(s.team_id) || "Unknown Team",
      }));
      setStandings(standingsWithNames);
    } else if (currentTab === "fixtures" || currentTab === "results") {
      const fixturesData = await getLeagueFixtures(selectedLeague.id);
      const names = await loadTeamNamesMap();
      setTeamNames(names);
      const fixturesWithNames = fixturesData.map((f) => ({
        ...f,
        home_team_name: names.get(f.home_team_id) || "Unknown Team",
        away_team_name: names.get(f.away_team_id) || "Unknown Team",
      }));
      setFixtures(fixturesWithNames);
    } else if (currentTab === "teams") {
      const teams = await getLeagueTeams(selectedLeague.id);
      const names = await loadTeamNamesMap();
      setTeamNames(names);
      setLeagueTeams(teams);
    }
  }

  async function loadTeamNamesMap(): Promise<Map<string, string>> {
    if (!selectedLeague) return new Map();

    const teams = await getLeagueTeams(selectedLeague.id);
    const { data } = await supabase
      .from("league_teams")
      .select("id, team_id")
      .eq("league_id", selectedLeague.id);

    const nameMap = new Map<string, string>();

    if (data) {
      for (const team of data) {
        const { data: teamData } = await supabase
          .from("league_teams")
          .select("team_id")
          .eq("id", team.id)
          .maybeSingle();

        if (teamData) {
          nameMap.set(team.id, teamData.team_id);
        }
      }
    }

    return nameMap;
  }

  async function handleCreateLeague(leagueData: Omit<League, "id" | "user_id" | "created_at">) {
    const created = await createLeague(leagueData);
    if (created) {
      await loadLeagues();
      setShowCreateLeague(false);
      setSelectedLeague(created);
    }
  }

  async function handleDeleteLeague() {
    if (!selectedLeague) return;
    const confirmed = confirm(`Delete league "${selectedLeague.name}"? This will remove all fixtures and standings.`);
    if (confirmed) {
      await deleteLeague(selectedLeague.id);
      await loadLeagues();
      setSelectedLeague(null);
    }
  }

  function handleStartMatch(fixture: LeagueFixture) {
    if (!selectedLeague) return;
    if (fixture.status === "COMPLETED" || fixture.match_id) {
      alert("This fixture has already been completed.");
      return;
    }
    if (onStartMatchFromFixture) {
      onStartMatchFromFixture(fixture, selectedLeague);
      onClose();
    }
  }

  async function handleViewResult(fixture: LeagueFixture) {
    if (fixture.match_id && onViewMatch) {
      onViewMatch(fixture.match_id);
      onClose();
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[#012b1b] via-[#064428] to-[#012b1b] z-50 flex items-center justify-center">
        <div className="text-white text-xl">Loading leagues...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#012b1b] via-[#064428] to-[#012b1b] z-50 overflow-y-auto pb-20">
      {/* Header */}
      <div className="bg-[#064428]/50 backdrop-blur-sm border-b border-[#0b5c33] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={onClose}
              className="text-green-300 hover:text-white text-2xl p-2 hover:bg-[#0b5c33]/50 rounded-lg transition-colors"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold text-white">Leagues</h1>
          </div>

          {/* League Selector */}
          {leagues.length > 0 && (
            <select
              value={selectedLeague?.id || ""}
              onChange={(e) => {
                const league = leagues.find((l) => l.id === e.target.value);
                setSelectedLeague(league || null);
              }}
              className="bg-[#0b5c33] border border-green-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0f9d3d]"
            >
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowCreateLeague(true)}
            className="ml-3 bg-[#0f9d3d] hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            + Create League
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {leagues.length === 0 ? (
          <div className="bg-[#064428]/40 rounded-2xl p-12 text-center border border-[#0b5c33]/50">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold mb-2 text-white">No Leagues Yet</h3>
            <p className="text-green-300 mb-6">
              Create your first league to organize matches and track standings
            </p>
            <button
              onClick={() => setShowCreateLeague(true)}
              className="bg-[#0f9d3d] hover:bg-green-600 px-6 py-3 rounded-lg font-semibold transition-colors inline-block text-white"
            >
              Create Your First League
            </button>
          </div>
        ) : selectedLeague ? (
          <>
            {/* League Info Card */}
            <div className="bg-[#064428]/40 rounded-xl p-6 mb-6 border border-[#0b5c33]/50">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedLeague.name}</h2>
                  <div className="flex gap-4 text-sm text-green-300">
                    <span>Format: {selectedLeague.format}</span>
                    <span>•</span>
                    <span>{selectedLeague.overs} overs</span>
                    {selectedLeague.location && (
                      <>
                        <span>•</span>
                        <span>{selectedLeague.location}</span>
                      </>
                    )}
                  </div>
                  {selectedLeague.start_date && (
                    <div className="text-sm text-green-400 mt-1">
                      {new Date(selectedLeague.start_date).toLocaleDateString()}
                      {selectedLeague.end_date && ` - ${new Date(selectedLeague.end_date).toLocaleDateString()}`}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleDeleteLeague}
                  className="text-red-400 hover:text-red-300 text-sm px-3 py-1 hover:bg-red-900/20 rounded transition-colors"
                >
                  Delete League
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {(["table", "fixtures", "results", "teams"] as TabView[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCurrentTab(tab)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                    currentTab === tab
                      ? "bg-[#0f9d3d] text-white"
                      : "bg-[#064428]/40 text-green-300 hover:bg-[#0b5c33]/50"
                  }`}
                >
                  {tab === "table" && "Table"}
                  {tab === "fixtures" && "Fixtures"}
                  {tab === "results" && "Results"}
                  {tab === "teams" && "Teams"}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {currentTab === "table" && (
              <LeagueTableView standings={standings} />
            )}

            {currentTab === "fixtures" && (
              <FixturesView
                fixtures={fixtures.filter((f) => f.status !== "COMPLETED")}
                leagueId={selectedLeague.id}
                onCreateFixture={() => setShowCreateFixture(true)}
                onRefresh={loadLeagueData}
                onStartMatch={handleStartMatch}
              />
            )}

            {currentTab === "results" && (
              <ResultsView fixtures={fixtures.filter((f) => f.status === "COMPLETED")} onViewResult={handleViewResult} />
            )}

            {currentTab === "teams" && (
              <TeamsView
                teams={leagueTeams}
                teamNames={teamNames}
                onAddTeam={() => setShowAddTeam(true)}
                onRemoveTeam={async (teamId) => {
                  if (selectedLeague) {
                    await removeTeamFromLeague(selectedLeague.id, teamId);
                    await loadLeagueData();
                  }
                }}
              />
            )}
          </>
        ) : null}
      </div>

      {/* Create League Modal */}
      {showCreateLeague && (
        <CreateLeagueModal
          onClose={() => setShowCreateLeague(false)}
          onCreate={handleCreateLeague}
        />
      )}

      {/* Create Fixture Modal */}
      {showCreateFixture && selectedLeague && (
        <CreateFixtureModal
          league={selectedLeague}
          teams={leagueTeams}
          teamNames={teamNames}
          onClose={() => setShowCreateFixture(false)}
          onCreated={loadLeagueData}
        />
      )}

      {/* Add Team Modal */}
      {showAddTeam && selectedLeague && (
        <AddTeamModal
          leagueId={selectedLeague.id}
          onClose={() => setShowAddTeam(false)}
          onAdded={loadLeagueData}
        />
      )}
    </div>
  );
}

// League Table View Component
function LeagueTableView({ standings }: { standings: LeagueStanding[] }) {
  if (standings.length === 0) {
    return (
      <div className="bg-[#064428]/40 rounded-xl p-12 text-center border border-[#0b5c33]/50">
        <div className="text-5xl mb-4">📋</div>
        <h3 className="text-xl font-bold mb-2 text-white">No Standings Yet</h3>
        <p className="text-green-300 text-sm">
          The league table will appear once matches are completed
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#064428]/40 rounded-xl border border-[#0b5c33]/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-white">
          <thead className="bg-[#0b5c33]/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold">Pos</th>
              <th className="px-4 py-3 text-left text-xs font-semibold">Team</th>
              <th className="px-4 py-3 text-center text-xs font-semibold">P</th>
              <th className="px-4 py-3 text-center text-xs font-semibold">W</th>
              <th className="px-4 py-3 text-center text-xs font-semibold">L</th>
              <th className="px-4 py-3 text-center text-xs font-semibold">T</th>
              <th className="px-4 py-3 text-center text-xs font-semibold">Pts</th>
              <th className="px-4 py-3 text-center text-xs font-semibold">NRR</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing, index) => (
              <tr key={standing.id} className="border-t border-[#0b5c33]/30">
                <td className="px-4 py-3 text-green-400 font-bold">{index + 1}</td>
                <td className="px-4 py-3 font-medium">{standing.team_name || "Unknown Team"}</td>
                <td className="px-4 py-3 text-center">{standing.matches_played}</td>
                <td className="px-4 py-3 text-center text-green-400">{standing.wins}</td>
                <td className="px-4 py-3 text-center text-red-400">{standing.losses}</td>
                <td className="px-4 py-3 text-center text-yellow-400">{standing.ties}</td>
                <td className="px-4 py-3 text-center font-bold text-[#0f9d3d]">{standing.points}</td>
                <td className="px-4 py-3 text-center">{standing.net_run_rate.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Fixtures View Component
function FixturesView({
  fixtures,
  leagueId,
  onCreateFixture,
  onRefresh,
  onStartMatch,
}: {
  fixtures: LeagueFixture[];
  leagueId: string;
  onCreateFixture: () => void;
  onRefresh: () => void;
  onStartMatch: (fixture: LeagueFixture) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Upcoming Fixtures</h3>
        <button
          onClick={onCreateFixture}
          className="bg-[#0f9d3d] hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
        >
          + Create Fixture
        </button>
      </div>

      {fixtures.length === 0 ? (
        <div className="bg-[#064428]/40 rounded-xl p-12 text-center border border-[#0b5c33]/50">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-xl font-bold mb-2 text-white">No Fixtures Yet</h3>
          <p className="text-green-300 text-sm mb-6">
            Create fixtures to schedule league matches
          </p>
          <button
            onClick={onCreateFixture}
            className="bg-[#0f9d3d] hover:bg-green-600 px-6 py-3 rounded-lg font-semibold transition-colors inline-block text-white"
          >
            Create First Fixture
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {fixtures.map((fixture) => (
            <div
              key={fixture.id}
              className="bg-[#064428]/40 rounded-xl p-5 border border-[#0b5c33]/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-green-400 text-sm mb-1">
                    {new Date(fixture.match_date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    • {fixture.match_time}
                  </div>
                  <div className="text-white font-semibold text-lg mb-1">
                    {fixture.home_team_name || "Home Team"} vs {fixture.away_team_name || "Away Team"}
                  </div>
                  {fixture.venue && (
                    <div className="text-green-300 text-sm">📍 {fixture.venue}</div>
                  )}
                  {fixture.round && (
                    <div className="text-green-400 text-xs mt-1">{fixture.round}</div>
                  )}
                </div>
                <button
                  onClick={() => onStartMatch(fixture)}
                  className="bg-[#0f9d3d] hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Start Match
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Results View Component
function ResultsView({ fixtures, onViewResult }: { fixtures: LeagueFixture[]; onViewResult: (fixture: LeagueFixture) => void }) {
  if (fixtures.length === 0) {
    return (
      <div className="bg-[#064428]/40 rounded-xl p-12 text-center border border-[#0b5c33]/50">
        <div className="text-5xl mb-4">🏏</div>
        <h3 className="text-xl font-bold mb-2 text-white">No Results Yet</h3>
        <p className="text-green-300 text-sm">
          Completed match results will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fixtures.map((fixture) => (
        <div
          key={fixture.id}
          onClick={() => onViewResult(fixture)}
          className="bg-[#064428]/40 rounded-xl p-5 border border-[#0b5c33]/50 cursor-pointer hover:bg-[#064428]/60 transition-colors"
        >
          <div className="text-green-400 text-sm mb-2">
            {new Date(fixture.match_date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>
          <div className="text-white font-semibold text-lg">
            {fixture.home_team_name || "Home Team"} vs {fixture.away_team_name || "Away Team"}
          </div>
          {fixture.venue && (
            <div className="text-green-300 text-sm mt-1">📍 {fixture.venue}</div>
          )}
          <div className="mt-2">
            <span className="text-xs bg-green-900/40 text-green-400 px-2 py-1 rounded">
              View Result →
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Teams View Component
function TeamsView({
  teams,
  teamNames,
  onAddTeam,
  onRemoveTeam,
}: {
  teams: LeagueTeam[];
  teamNames: Map<string, string>;
  onAddTeam: () => void;
  onRemoveTeam: (teamId: string) => void;
}) {
  if (teams.length === 0) {
    return (
      <div className="bg-[#064428]/40 rounded-xl p-12 text-center border border-[#0b5c33]/50">
        <div className="text-5xl mb-4">🏏</div>
        <h3 className="text-xl font-bold mb-2 text-white">No Teams Yet</h3>
        <p className="text-green-300 text-sm mb-6">
          Add teams to this league to create fixtures
        </p>
        <button
          onClick={onAddTeam}
          className="bg-[#0f9d3d] hover:bg-green-600 px-6 py-3 rounded-lg font-semibold transition-colors inline-block text-white"
        >
          Add First Team
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">League Teams</h3>
        <button
          onClick={onAddTeam}
          className="bg-[#0f9d3d] hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
        >
          + Add Team
        </button>
      </div>

      <div className="grid gap-3">
        {teams.map((team) => (
          <div
            key={team.id}
            className="bg-[#064428]/40 rounded-xl p-4 border border-[#0b5c33]/50 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">🏏</div>
              <div>
                <div className="text-white font-semibold">{teamNames.get(team.id) || team.team_id}</div>
              </div>
            </div>
            <button
              onClick={() => onRemoveTeam(team.team_id)}
              className="text-red-400 hover:text-red-300 text-sm px-3 py-1 hover:bg-red-900/20 rounded transition-colors"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Create League Modal Component
interface CreateLeagueModalProps {
  onClose: () => void;
  onCreate: (league: Omit<League, "id" | "user_id" | "created_at">) => void;
}

function CreateLeagueModal({ onClose, onCreate }: CreateLeagueModalProps) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<"INDOOR" | "T20" | "ODI">("INDOOR");
  const [overs, setOvers] = useState(18);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    onCreate({
      name: name.trim(),
      format,
      overs,
      start_date: startDate || null,
      end_date: endDate || null,
      location: location.trim() || null,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[60] p-4">
      <div className="bg-[#064428] rounded-xl max-w-md w-full border border-[#0b5c33]">
        <div className="border-b border-[#0b5c33] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Create New League</h2>
          <button
            onClick={onClose}
            className="text-2xl hover:bg-[#0b5c33] rounded-lg p-2 transition-colors text-white"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-white">League Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Indoor League 2025"
              className="w-full bg-[#012b1b] border border-[#0b5c33] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0f9d3d] text-white placeholder-green-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-white">Format</label>
            <select
              value={format}
              onChange={(e) => {
                const newFormat = e.target.value as "INDOOR" | "T20" | "ODI";
                setFormat(newFormat);
                if (newFormat === "INDOOR") setOvers(18);
                else if (newFormat === "T20") setOvers(20);
                else if (newFormat === "ODI") setOvers(50);
              }}
              className="w-full bg-[#012b1b] border border-[#0b5c33] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0f9d3d] text-white"
            >
              <option value="INDOOR">Indoor Cricket</option>
              <option value="T20">T20</option>
              <option value="ODI">ODI</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-white">Overs per Innings</label>
            <input
              type="number"
              value={overs}
              onChange={(e) => setOvers(parseInt(e.target.value) || 18)}
              min="1"
              max="50"
              className="w-full bg-[#012b1b] border border-[#0b5c33] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0f9d3d] text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-white">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#012b1b] border border-[#0b5c33] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0f9d3d] text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-white">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#012b1b] border border-[#0b5c33] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0f9d3d] text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-white">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Central Indoor Arena"
              className="w-full bg-[#012b1b] border border-[#0b5c33] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0f9d3d] text-white placeholder-green-600"
            />
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#012b1b] hover:bg-[#0b5c33] px-6 py-3 rounded-lg font-semibold transition-colors text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#0f9d3d] hover:bg-green-600 px-6 py-3 rounded-lg font-semibold transition-colors text-white"
            >
              Create League
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Create Fixture Modal Component
interface CreateFixtureModalProps {
  league: League;
  teams: LeagueTeam[];
  teamNames: Map<string, string>;
  onClose: () => void;
  onCreated: () => void;
}

function CreateFixtureModal({ league, teams, teamNames, onClose, onCreated }: CreateFixtureModalProps) {
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [round, setRound] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [matchTime, setMatchTime] = useState("19:00");
  const [venue, setVenue] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!homeTeamId || !awayTeamId || !matchDate || homeTeamId === awayTeamId) {
      alert("Please fill all required fields and ensure home and away teams are different");
      return;
    }

    const { createFixture } = await import("../store/leagues");
    const created = await createFixture({
      league_id: league.id,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      match_id: null,
      round: round || null,
      match_date: matchDate,
      match_time: matchTime,
      venue: venue || null,
      notes: notes || null,
      status: "SCHEDULED",
    });

    if (created) {
      onCreated();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[60] p-4">
      <div className="bg-[#064428] rounded-xl max-w-md w-full border border-[#0b5c33] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-[#0b5c33] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#064428]">
          <h2 className="text-xl font-bold text-white">Create Fixture</h2>
          <button
            onClick={onClose}
            className="text-2xl hover:bg-[#0b5c33] rounded-lg p-2 transition-colors text-white"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-white">Home Team *</label>
            <select
              value={homeTeamId}
              onChange={(e) => setHomeTeamId(e.target.value)}
              className="w-full bg-[#012b1b] border border-[#0b5c33] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0f9d3d] text-white"
              required
            >
              <option value="">Select home team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {teamNames.get(team.id) || team.team_id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-white">Away Team *</label>
            <select
              value={awayTeamId}
              onChange={(e) => setAwayTeamId(e.target.value)}
              className="w-full bg-[#012b1b] border border-[#0b5c33] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0f9d3d] text-white"
              required
            >
              <option value="">Select away team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id} disabled={team.id === homeTeamId}>
                  {teamNames.get(team.id) || team.team_id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-white">Round / Week</label>
            <input
              type="text"
              value={round}
              onChange={(e) => setRound(e.target.value)}
              placeholder="e.g. Round 1, Week 3"
              className="w-full bg-[#012b1b] border border-[#0b5c33] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0f9d3d] text-white placeholder-green-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-white">Date *</label>
              <input
                type="date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="w-full bg-[#012b1b] border border-[#0b5c33] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0f9d3d] text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-white">Time *</label>
              <input
                type="time"
                value={matchTime}
                onChange={(e) => setMatchTime(e.target.value)}
                className="w-full bg-[#012b1b] border border-[#0b5c33] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0f9d3d] text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-white">Venue</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. XYZ Indoor Center"
              className="w-full bg-[#012b1b] border border-[#0b5c33] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0f9d3d] text-white placeholder-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-white">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
              className="w-full bg-[#012b1b] border border-[#0b5c33] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0f9d3d] text-white placeholder-green-600 resize-none"
            />
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#012b1b] hover:bg-[#0b5c33] px-6 py-3 rounded-lg font-semibold transition-colors text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#0f9d3d] hover:bg-green-600 px-6 py-3 rounded-lg font-semibold transition-colors text-white"
            >
              Create Fixture
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Team Modal Component
interface AddTeamModalProps {
  leagueId: string;
  onClose: () => void;
  onAdded: () => void;
}

function AddTeamModal({ leagueId, onClose, onAdded }: AddTeamModalProps) {
  const [teamName, setTeamName] = useState("");
  const [existingTeams, setExistingTeams] = useState<string[]>([]);

  useEffect(() => {
    loadExistingTeams();
  }, []);

  async function loadExistingTeams() {
    const matches = await listMatchesFromDb();
    const uniqueTeams = new Set<string>();
    matches.forEach((match) => {
      if (match.teamAName) uniqueTeams.add(match.teamAName);
      if (match.teamBName) uniqueTeams.add(match.teamBName);
    });
    setExistingTeams(Array.from(uniqueTeams).sort());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) return;

    const success = await addTeamToLeague(leagueId, teamName.trim());
    if (success) {
      onAdded();
      onClose();
    } else {
      alert("Failed to add team. Team may already exist in this league.");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[60] p-4">
      <div className="bg-[#064428] rounded-xl max-w-md w-full border border-[#0b5c33]">
        <div className="border-b border-[#0b5c33] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Add Team to League</h2>
          <button
            onClick={onClose}
            className="text-2xl hover:bg-[#0b5c33] rounded-lg p-2 transition-colors text-white"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-white">Team Name *</label>
            {existingTeams.length > 0 ? (
              <select
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-[#012b1b] border border-[#0b5c33] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0f9d3d] text-white"
                required
              >
                <option value="">Select existing team or enter new name</option>
                {existingTeams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            ) : null}
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
              className="w-full bg-[#012b1b] border border-[#0b5c33] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0f9d3d] text-white placeholder-green-600 mt-2"
              required
            />
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#012b1b] hover:bg-[#0b5c33] px-6 py-3 rounded-lg font-semibold transition-colors text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#0f9d3d] hover:bg-green-600 px-6 py-3 rounded-lg font-semibold transition-colors text-white"
            >
              Add Team
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
