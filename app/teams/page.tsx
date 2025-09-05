"use client";
import { useState } from "react";
import { Team, useTeams } from "../context/TeamContext";
import { FabMenu } from "../components/FavMenu";

export default function TeamsPage() {
  const { teams, deleteTeam, removePlayer } = useTeams();
  const [openCreate, setOpenCreate] = useState(false);
  return (
    <main className="section">
      <div className="container">
        <h2 className="section-title">Teams</h2>

        <button className="btn" onClick={() => setOpenCreate(true)}>
          Create team
        </button>
        {openCreate && <CreateTeamModal onClose={() => setOpenCreate(false)} />}

        <div className="grid grid-3" style={{ marginTop: 16 }}>
          {teams.map((t) => (
            <div key={t.id} className="card" style={{ padding: 14 }}>
              <b style={{ fontSize: 18 }}>{t.name}</b>
              <div style={{ color: "#666", marginTop: 6 }}>
                {t.region}, {t.country}
              </div>
              <div style={{ marginTop: 8 }}>
                Players: <b>{t.playerIds.length}</b>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <EditTeamModalBtn team={t} />
                <DeleteTeamModalBtn team={t} onDelete={() => deleteTeam(t.id)} />
              </div>

              {/* list players with remove option */}
              {t.playerIds.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Members</div>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {t.playerIds.map((pid) => (
                      <li key={pid} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "6px 0" }}>
                        <span>Player #{pid}</span>
                        <button className="btn" onClick={() => removePlayer(t.id, pid)}>
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <FabMenu />
    </main>
  );
}

function CreateTeamModal({ onClose }: { onClose: () => void }) {
  const { createTeam } = useTeams();
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("");
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Create team</h3>
        <FormFields name={name} setName={setName} region={region} setRegion={setRegion} country={country} setCountry={setCountry} />
        {err && <div style={{ color: "#c00", marginTop: 10 }}>{err}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn"
            onClick={() => {
              if (!name.trim() || !region.trim() || !country.trim()) {
                setErr("All fields are required.");
                return;
              }
              const e = createTeam({ id: crypto.randomUUID(), name: name.trim(), region: region.trim(), country: country.trim() });
              if (e) setErr(e);
              else onClose();
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

function EditTeamModalBtn({ team }: { team: Team }) {
  const { updateTeam } = useTeams();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(team.name);
  const [region, setRegion] = useState(team.region);
  const [country, setCountry] = useState(team.country);
  const [err, setErr] = useState<string | null>(null);
  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}>
        Edit
      </button>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Edit team</h3>
            <FormFields name={name} setName={setName} region={region} setRegion={setRegion} country={country} setCountry={setCountry} />
            {err && <div style={{ color: "#c00", marginTop: 10 }}>{err}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="btn" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                className="btn"
                onClick={() => {
                  if (!name.trim() || !region.trim() || !country.trim()) {
                    setErr("All fields are required.");
                    return;
                  }
                  const e = updateTeam(team.id, { name: name.trim(), region: region.trim(), country: country.trim() });
                  if (e) setErr(e);
                  else setOpen(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DeleteTeamModalBtn({ team, onDelete }: { team: Team; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn" onClick={() => setOpen(true)} style={{ borderColor: "#f3d2d2", background: "#fff5f5" }}>
        Delete
      </button>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Delete team?</h3>
            <p>
              Deleting <b>{team.name}</b> will remove all its player assignments.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="btn" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                className="btn"
                onClick={() => {
                  onDelete();
                  setOpen(false);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FormFields(props: { name: string; setName: (v: string) => void; region: string; setRegion: (v: string) => void; country: string; setCountry: (v: string) => void }) {
  return (
    <div style={{ display: "grid", gap: 12, marginBottom: 12 }}>
      <input placeholder="Team name (unique)" value={props.name} onChange={(e) => props.setName(e.target.value)} style={{ width: "100%", padding: "12px 14px", border: "1px solid #ddd", borderRadius: 12 }} />
      <input placeholder="Region" value={props.region} onChange={(e) => props.setRegion(e.target.value)} style={{ width: "100%", padding: "12px 14px", border: "1px solid #ddd", borderRadius: 12 }} />
      <input placeholder="Country" value={props.country} onChange={(e) => props.setCountry(e.target.value)} style={{ width: "100%", padding: "12px 14px", border: "1px solid #ddd", borderRadius: 12 }} />
    </div>
  );
}
