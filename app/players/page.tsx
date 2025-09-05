"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTeams } from "../context/TeamContext";
import { FabMenu } from "../components/FavMenu";

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

// simple rate limit: ensure ≥ 1100ms between calls
const MIN_GAP_MS = 1100;

export default function PlayersPage() {
  const { teams, playerTeam, addPlayer, removePlayer } = useTeams();

  const [players, setPlayers] = useState<Player[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastCallRef = useRef<number>(0);
  const mountedOnceRef = useRef(false);

  // re-enable scrolling on this page (in case home page set overflow:hidden)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "auto";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    if (page > MAX_PAGES) {
      setHasMore(false);
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
        // too many requests → backoff a bit and show a friendly message
        await new Promise((r) => setTimeout(r, 1500));
        setError("Rate limited by API. Please wait a moment and try again.");
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
      }

      const json = await res.json();
      const data = (json?.data ?? []) as Player[];

      // dedupe by id
      setPlayers((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const fresh = data.filter((p) => !seen.has(p.id));
        return [...prev, ...fresh];
      });

      // hasMore logic: based on data length and page cap
      const gotFull = (data?.length ?? 0) === PER_PAGE;
      const nextPage = gotFull && page < MAX_PAGES ? page + 1 : page;
      setHasMore(gotFull && page < MAX_PAGES);
      setPage(nextPage);
    } catch (e: unknown) {
      console.error(e);
      setError("Failed to load players. Please try again.");
    } finally {
      lastCallRef.current = Date.now();
      setLoading(false);
    }
  }, [loading, hasMore, page]);

  // load first page once (avoid StrictMode double-call)
  useEffect(() => {
    if (mountedOnceRef.current) return;
    mountedOnceRef.current = true;
    loadMore();
  }, [loadMore]);

  const teamList = useMemo(() => teams, [teams]);

  return (
    <main className="section" style={{ minHeight: "100vh" }}>
      <div className="container">
        <h2 className="section-title text-amber-600">Players </h2>

        {error && <div style={{ marginBottom: 12, color: "#c00" }}>{error}</div>}

        <div className="grid grid-3">
          {players.map((p) => {
            const assignedTeamId = playerTeam[p.id];
            const assignedTeam = teamList.find((t) => t.id === assignedTeamId);

            return (
              <div key={p.id} className="card" style={{ padding: 14 }}>
                <b>
                  {p.first_name} {p.last_name}
                </b>
                <div style={{ color: "#666", marginTop: 6 }}>Team: {p.team?.full_name ?? "—"}</div>
                <div style={{ color: "#666" }}>Position: {p.position || "—"}</div>

                {assignedTeam ? (
                  <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "#222" }}>
                      Assigned to <b>{assignedTeam.name}</b>
                    </span>
                    <button className="btn" onClick={() => removePlayer(assignedTeam.id, p.id)}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <AssignToTeam add={(teamId) => addPlayer(teamId, p.id)} />
                )}
              </div>
            );
          })}
        </div>

        {/* <div style={{ display: "flex", justifyContent: "center", marginTop: 20, paddingBottom: 24 }}>
          {hasMore ? (
            <button className="btn" disabled={loading} onClick={loadMore}>
              {loading ? "Loading…" : "Load more"}
            </button>
          ) : players.length ? (
            <span>End of list (100 max).</span>
          ) : (
            <span>No players.</span>
          )}
        </div> */}
      </div>
      <FabMenu />
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
      <div style={{ marginTop: 12 }}>
        <span style={{ color: "#777" }}>Create a team first.</span>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginTop: 12 }}>
        <button className="btn" onClick={() => setOpen(true)}>
          Add to team…
        </button>
      </div>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Assign player</h3>

            <select value={teamId} onChange={(e) => setTeamId(e.target.value)} style={{ width: "100%", padding: "12px 14px", border: "1px solid #ddd", borderRadius: 12 }}>
              <option value="">Choose team</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            {err && <div style={{ color: "#c00", marginTop: 10 }}>{err}</div>}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
              <button className="btn" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                className="btn"
                onClick={() => {
                  if (!teamId) {
                    setErr("Pick a team.");
                    return;
                  }
                  const e = add(teamId);
                  if (e) setErr(e);
                  else setOpen(false);
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
