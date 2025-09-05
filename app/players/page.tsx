"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTeams } from "../context/TeamContext";
import { FabMenu } from "../components/FavMenu";
import AuthFab from "../components/AuthFab";

type Player = {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  team: { id: number; full_name: string };
};

const API_URL = "https://api.balldontlie.io/v1/players";
const API_KEY = process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY!;

const PER_PAGE = 10;
const MAX_PAGES = 10;
const MIN_GAP_MS = 1100;

// Mock data for fallback when API fails
const MOCK_PLAYERS: Player[] = [
  { id: 1, first_name: "LeBron", last_name: "James", position: "F", team: { id: 1, full_name: "Los Angeles Lakers" } },
  { id: 2, first_name: "Stephen", last_name: "Curry", position: "G", team: { id: 2, full_name: "Golden State Warriors" } },
  { id: 3, first_name: "Kevin", last_name: "Durant", position: "F", team: { id: 3, full_name: "Phoenix Suns" } },
  { id: 4, first_name: "Giannis", last_name: "Antetokounmpo", position: "F", team: { id: 4, full_name: "Milwaukee Bucks" } },
  { id: 5, first_name: "Nikola", last_name: "Jokic", position: "C", team: { id: 5, full_name: "Denver Nuggets" } },
  { id: 6, first_name: "Luka", last_name: "Doncic", position: "G", team: { id: 6, full_name: "Dallas Mavericks" } },
  { id: 7, first_name: "Jayson", last_name: "Tatum", position: "F", team: { id: 7, full_name: "Boston Celtics" } },
  { id: 8, first_name: "Joel", last_name: "Embiid", position: "C", team: { id: 8, full_name: "Philadelphia 76ers" } },
  { id: 9, first_name: "Damian", last_name: "Lillard", position: "G", team: { id: 9, full_name: "Milwaukee Bucks" } },
  { id: 10, first_name: "Anthony", last_name: "Davis", position: "F-C", team: { id: 1, full_name: "Los Angeles Lakers" } },
  { id: 11, first_name: "Kawhi", last_name: "Leonard", position: "F", team: { id: 10, full_name: "LA Clippers" } },
  { id: 12, first_name: "Paul", last_name: "George", position: "F", team: { id: 10, full_name: "LA Clippers" } },
  { id: 13, first_name: "Jimmy", last_name: "Butler", position: "F", team: { id: 11, full_name: "Miami Heat" } },
  { id: 14, first_name: "Bam", last_name: "Adebayo", position: "C", team: { id: 11, full_name: "Miami Heat" } },
  { id: 15, first_name: "Devin", last_name: "Booker", position: "G", team: { id: 3, full_name: "Phoenix Suns" } },
  { id: 16, first_name: "Ja", last_name: "Morant", position: "G", team: { id: 12, full_name: "Memphis Grizzlies" } },
  { id: 17, first_name: "Trae", last_name: "Young", position: "G", team: { id: 13, full_name: "Atlanta Hawks" } },
  { id: 18, first_name: "Karl-Anthony", last_name: "Towns", position: "C", team: { id: 14, full_name: "New York Knicks" } },
  { id: 19, first_name: "Russell", last_name: "Westbrook", position: "G", team: { id: 15, full_name: "Denver Nuggets" } },
  { id: 20, first_name: "Chris", last_name: "Paul", position: "G", team: { id: 2, full_name: "Golden State Warriors" } },
];

const getPositionColor = (position: string): string => {
  const pos = position.toLowerCase();
  if (pos.includes("g")) return "from-blue-500 to-blue-600";
  if (pos.includes("f")) return "from-green-500 to-green-600";
  if (pos.includes("c")) return "from-purple-500 to-purple-600";
  return "from-gray-500 to-gray-600";
};

const getPositionIcon = (position: string): string => {
  const pos = position.toLowerCase();
  if (pos.includes("g")) return "⚡"; // Guard - Speed/Agility
  if (pos.includes("f")) return "🏀"; // Forward - Versatile
  if (pos.includes("c")) return "🏗️"; // Center - Strong/Tall
  return "👤";
};

export default function PlayersPage() {
  const { teams, playerTeam, addPlayer, removePlayer } = useTeams();

  const [players, setPlayers] = useState<Player[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const lastCallRef = useRef<number>(0);
  const mountedOnceRef = useRef(false);

  // re-enable scrolling on this page
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "auto";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const loadMockData = useCallback(() => {
    setUsingMockData(true);
    setPlayers(MOCK_PLAYERS);
    setHasMore(false);
    setLoading(false);
    setError(null);
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    if (page > MAX_PAGES) {
      setHasMore(false);
      return;
    }

    // If no API key, use mock data immediately
    if (!API_KEY) {
      loadMockData();
      return;
    }

    // rate limit guard
    const now = Date.now();
    const delta = now - lastCallRef.current;
    if (delta < MIN_GAP_MS) {
      await new Promise((r) => setTimeout(r, MIN_GAP_MS - delta));
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}?page=${page}&per_page=${PER_PAGE}`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
        cache: "no-store",
      });

      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 1500));
        setError("Rate limited by API. Using sample data instead.");
        loadMockData();
        return;
      }

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const json = await res.json();
      const data = (json?.data ?? []) as Player[];

      // dedupe by id
      setPlayers((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const fresh = data.filter((p) => !seen.has(p.id));
        return [...prev, ...fresh];
      });

      const gotFull = (data?.length ?? 0) === PER_PAGE;
      const nextPage = gotFull && page < MAX_PAGES ? page + 1 : page;
      setHasMore(gotFull && page < MAX_PAGES);
      setPage(nextPage);
    } catch (e: unknown) {
      console.error(e);
      setError("API unavailable. Using sample data instead.");
      loadMockData();
    } finally {
      lastCallRef.current = Date.now();
      setLoading(false);
    }
  }, [loading, hasMore, page, loadMockData]);

  // load first page once
  useEffect(() => {
    if (mountedOnceRef.current) return;
    mountedOnceRef.current = true;
    loadMore();
  }, [loadMore]);

  const teamList = useMemo(() => teams, [teams]);

  // Filter players based on search query
  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return players;
    return players.filter((p) => `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) || p.team?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.position.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [players, searchQuery]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">NBA Players</h1>
          <p className="text-gray-600 text-lg mb-8">Browse and assign players to your teams</p>

          {usingMockData && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl max-w-md mx-auto">
              <div className="flex items-center gap-2 text-blue-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">Using sample data for demo</span>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <input type="text" placeholder="Search players, teams, or positions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-6 py-3 pl-12 bg-white border border-gray-200 rounded-full shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200" />
            <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {error && !usingMockData && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl mb-8 max-w-md mx-auto">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {/* Players Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlayers.map((p) => {
            const assignedTeamId = playerTeam[p.id];
            const assignedTeam = teamList.find((t) => t.id === assignedTeamId);

            return (
              <div key={p.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-orange-200">
                {/* Player Header */}
                <div className={`bg-gradient-to-r ${getPositionColor(p.position)} p-6 text-white relative overflow-hidden`}>
                  <div className="absolute top-2 right-2 text-2xl opacity-20">{getPositionIcon(p.position)}</div>
                  <h3 className="text-xl font-bold mb-1">
                    {p.first_name} {p.last_name}
                  </h3>
                  <div className="flex items-center gap-2 text-white/90">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">{p.position || "—"}</span>
                  </div>
                </div>

                <div className="p-6">
                  {/* Team Info */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gray-100 p-3 rounded-full">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm leading-tight">{p.team?.full_name || "Free Agent"}</p>
                      <p className="text-gray-500 text-xs">NBA Team</p>
                    </div>
                  </div>

                  {/* Assignment Status */}
                  {assignedTeam ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-green-700 text-sm font-medium">Assigned to {assignedTeam.name}</span>
                      </div>
                      <button className="w-full bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm" onClick={() => removePlayer(assignedTeam.id, p.id)}>
                        Remove from Team
                      </button>
                    </div>
                  ) : (
                    <AssignToTeam add={(teamId) => addPlayer(teamId, p.id)} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More Section */}
        {!usingMockData && (
          <div className="text-center mt-12 pb-8">
            {hasMore ? (
              <button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none" disabled={loading} onClick={loadMore}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </div>
                ) : (
                  "Load More Players"
                )}
              </button>
            ) : players.length ? (
              <div className="text-gray-500">
                <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                That's all! ({players.length} players loaded)
              </div>
            ) : (
              <div className="text-gray-500">No players found</div>
            )}
          </div>
        )}

        {filteredPlayers.length === 0 && searchQuery && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <svg className="w-24 h-24 mx-auto mb-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No players found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search terms</p>
              <button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200" onClick={() => setSearchQuery("")}>
                Clear Search
              </button>
            </div>
          </div>
        )}
      </div>
      <FabMenu />
      <AuthFab/>
    </main>
  );
}

function AssignToTeam({ add }: { add: (teamId: string) => string | null }) {
  const { teams } = useTeams();
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string>("");

  if (!teams.length) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
        <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="text-gray-500 text-sm">Create a team first to assign players</p>
      </div>
    );
  }

  return (
    <>
      <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2" onClick={() => setOpen(true)}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add to Team
      </button>

      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-2 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Assign Player</h3>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Team</label>
                <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
                  <option value="">Choose a team...</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.region}, {t.country})
                    </option>
                  ))}
                </select>
              </div>

              {err && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-6">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-700 text-sm">{err}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all duration-200" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={() => {
                    if (!teamId) {
                      setErr("Please select a team.");
                      return;
                    }
                    const e = add(teamId);
                    if (e) setErr(e);
                    else setOpen(false);
                  }}
                >
                  Assign Player
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
