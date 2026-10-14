"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { seededScores } from "@/lib/data";
import type { Game, ScoreRow } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { getGames } from "@/lib/supabase/games";
export default function SalonPage() {
  const [games, setGames] = useState<Game[] | null>(null);
  const [gamesError, setGamesError] = useState<string | null>(null);
  const [tab, setTab] = useState<string | null>(null);
  const [asteroidsScores, setAsteroidsScores] = useState<ScoreRow[] | null>(
    null,
  );
  const [asteroidsError, setAsteroidsError] = useState<string | null>(null);
  useEffect(() => {
    const supabase = createClient();
    getGames(supabase)
      .then((g) => {
        setGames(g);
        setTab((prev) => prev ?? g[0]?.id ?? null);
      })
      .catch(() => setGamesError("No se pudieron cargar los juegos."));
  }, []);
  useEffect(() => {
    if (tab !== "asteroids") return;
    fetch("/api/scores?game=asteroids&limit=12")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setAsteroidsScores(data);
        setAsteroidsError(null);
      })
      .catch(() =>
        setAsteroidsError("No se pudieron cargar las puntuaciones."),
      );
  }, [tab]);
  const rows = useMemo(() => {
    if (!tab) return [];
    if (tab === "asteroids") return asteroidsScores ?? [];
    return seededScores(tab.length * 23 + 7, 12);
  }, [tab, asteroidsScores]);
  if (gamesError) {
    return (
      <div className="av-hall fade-in">
        <div className="hall-head">
          <h1>SALÓN DE LA FAMA</h1>
        </div>
        <div
          style={{
            textAlign: "center",
            padding: 80,
            color: "var(--ink-faint)",
          }}
        >
          {gamesError}
        </div>
      </div>
    );
  }
  if (!games || !tab) {
    return (
      <div className="av-hall fade-in">
        <div className="hall-head">
          <h1>SALÓN DE LA FAMA</h1>
        </div>
        <div
          className="pixel"
          style={{
            textAlign: "center",
            padding: 80,
            color: "var(--ink-faint)",
          }}
        >
          CARGANDO…
        </div>
      </div>
    );
  }
  const asteroidsLoading =
    tab === "asteroids" && asteroidsScores === null && !asteroidsError;
  const asteroidsEmpty =
    tab === "asteroids" &&
    asteroidsScores !== null &&
    asteroidsScores.length === 0;
  const showLeaderboard =
    !asteroidsLoading && !asteroidsError && !asteroidsEmpty;
  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>
      <div className="hall-tabs">
        {games.map((g) => (
          <button
            key={g.id}
            className={"chip" + (tab === g.id ? " active" : "")}
            onClick={() => setTab(g.id)}
          >
            {g.title}
          </button>
        ))}
      </div>
      {asteroidsLoading && (
        <div
          className="pixel"
          style={{
            textAlign: "center",
            padding: 60,
            color: "var(--ink-faint)",
          }}
        >
          CARGANDO…
        </div>
      )}
      {asteroidsError && (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            color: "var(--ink-faint)",
          }}
        >
          {asteroidsError}
        </div>
      )}
      {asteroidsEmpty && (
        <div
          className="pixel"
          style={{
            textAlign: "center",
            padding: 60,
            color: "var(--ink-faint)",
          }}
        >
          SIN PUNTUACIONES AÚN. SÉ EL PRIMERO.
        </div>
      )}
      {showLeaderboard && (
        <>
          <div className="podium">
            <div className="podium-slot silver">
              <div className="rank-num">02</div>
              <div className="name">{rows[1]?.name ?? "—"}</div>
              <div className="score">
                {rows[1] ? rows[1].score.toLocaleString("es-ES") : "—"}
              </div>
              <div className="date">{rows[1]?.date ?? "—"}</div>
            </div>
            <div className="podium-slot gold">
              <div
                className="pixel"
                style={{
                  fontSize: 9,
                  color: "var(--gold)",
                  letterSpacing: "0.18em",
                }}
              >
                CAMPEÓN
              </div>
              <div className="rank-num" style={{ fontSize: 36, marginTop: 4 }}>
                01
              </div>
              <div className="name">{rows[0]?.name ?? "—"}</div>
              <div className="score" style={{ fontSize: 20 }}>
                {rows[0] ? rows[0].score.toLocaleString("es-ES") : "—"}
              </div>
              <div className="date">{rows[0]?.date ?? "—"}</div>
            </div>
            <div className="podium-slot bronze">
              <div className="rank-num">03</div>
              <div className="name">{rows[2]?.name ?? "—"}</div>
              <div className="score">
                {rows[2] ? rows[2].score.toLocaleString("es-ES") : "—"}
              </div>
              <div className="date">{rows[2]?.date ?? "—"}</div>
            </div>
          </div>
          <div className="hall-table">
            <div className="th">
              <div>RANGO</div>
              <div>JUGADOR</div>
              <div>PUNTUACIÓN</div>
              <div>FECHA</div>
            </div>
            {rows.map((r, i) => (
              <div
                key={r.name + i}
                className={
                  "tr" +
                  (i === 0
                    ? " top1"
                    : i === 1
                      ? " top2"
                      : i === 2
                        ? " top3"
                        : "")
                }
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
                <div className="pl">{r.name}</div>
                <div className="sc">{r.score.toLocaleString("es-ES")}</div>
                <div className="dt">{r.date}</div>
              </div>
            ))}
          </div>
        </>
      )}
      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/biblioteca" className="btn lg">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}
