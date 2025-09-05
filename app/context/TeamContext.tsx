"use client";
import { createContext, useContext, useEffect, useMemo, useReducer } from "react";

export type Team = {
  id: string;
  name: string;
  region: string;
  country: string;
  playerIds: number[];
};

type State = {
  teams: Team[];
  playerTeam: Record<number, string | undefined>; // playerId -> teamId
};

type TeamContextType = State & {
  createTeam: (t: { id: string; name: string; region: string; country: string }) => string | null;
  updateTeam: (id: string, patch: Partial<Omit<Team, "id">>) => string | null;
  deleteTeam: (id: string) => void;
  addPlayer: (teamId: string, playerId: number) => string | null;
  removePlayer: (teamId: string, playerId: number) => void;
};

type Action = { type: "create"; team: Omit<Team, "playerIds"> } | { type: "update"; id: string; patch: Partial<Omit<Team, "id">> } | { type: "delete"; id: string } | { type: "addPlayer"; teamId: string; playerId: number } | { type: "removePlayer"; teamId: string; playerId: number } | { type: "hydrate"; state: State };

const KEY = "fluffy_teams_v1";

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate": {
      return action.state;
    }
    case "create": {
      return { ...state, teams: [...state.teams, { ...action.team, playerIds: [] }] };
    }
    case "update": {
      return { ...state, teams: state.teams.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)) };
    }
    case "delete": {
      const team = state.teams.find((t) => t.id === action.id);
      const playerTeam = { ...state.playerTeam };
      if (team) for (const pid of team.playerIds) delete playerTeam[pid];
      return { teams: state.teams.filter((t) => t.id !== action.id), playerTeam };
    }
    case "addPlayer": {
      const existingTeamId = state.playerTeam[action.playerId];
      if (existingTeamId && existingTeamId !== action.teamId) return state;
      return {
        teams: state.teams.map((t) => (t.id === action.teamId && !t.playerIds.includes(action.playerId) ? { ...t, playerIds: [...t.playerIds, action.playerId] } : t)),
        playerTeam: { ...state.playerTeam, [action.playerId]: action.teamId },
      };
    }
    case "removePlayer": {
      const playerTeam = { ...state.playerTeam };
      delete playerTeam[action.playerId];
      return {
        teams: state.teams.map((t) => (t.id === action.teamId ? { ...t, playerIds: t.playerIds.filter((id) => id !== action.playerId) } : t)),
        playerTeam,
      };
    }
    default:
      return state;
  }
}

const initialState: State = { teams: [], playerTeam: {} };

// const Ctx = createContext<
//   | (State & {
//       createTeam: (t: { id: string; name: string; region: string; country: string }) => string | null;
//       updateTeam: (id: string, patch: Partial<Omit<Team, "id">>) => string | null;
//       deleteTeam: (id: string) => void;
//       addPlayer: (teamId: string, playerId: number) => string | null;
//       removePlayer: (teamId: string, playerId: number) => void;
//     })
//   | null
//   >(null);

const Ctx = createContext<TeamContextType | null>(null);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  // Initialize from localStorage (once)
  const [state, dispatch] = useReducer(reducer, initialState, (s) => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
      return raw ? (JSON.parse(raw) as State) : s;
    } catch {
      return s;
    }
  });

  // Persist on changes
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const api = useMemo(
    () => ({
      ...state,
      createTeam: (t: { id: string; name: string; region: string; country: string }) => {
        const exists = state.teams.some((x) => x.name.trim().toLowerCase() === t.name.trim().toLowerCase());
        if (exists) return "Team name must be unique.";
        dispatch({ type: "create", team: t });
        return null;
      },
      updateTeam: (id: string, patch: Partial<Omit<Team, "id">>) => {
        if (patch.name) {
          const exists = state.teams.some((x) => x.id !== id && x.name.trim().toLowerCase() === patch.name!.trim().toLowerCase());
          if (exists) return "Team name must be unique.";
        }
        dispatch({ type: "update", id, patch });
        return null;
      },
      deleteTeam: (id: string) => dispatch({ type: "delete", id }),
      addPlayer: (teamId: string, playerId: number) => {
        const occupied = state.playerTeam[playerId];
        if (occupied && occupied !== teamId) return "Player is already assigned to another team.";
        dispatch({ type: "addPlayer", teamId, playerId });
        return null;
      },
      removePlayer: (teamId: string, playerId: number) => dispatch({ type: "removePlayer", teamId, playerId }),
    }),
    [state]
  );

  return <Ctx.Provider value={api as TeamContextType}>{children}</Ctx.Provider>;
}

export const useTeams = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("TeamProvider missing");
  return v;
};
