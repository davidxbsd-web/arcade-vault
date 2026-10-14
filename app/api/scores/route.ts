import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTopScores, insertScore } from "@/lib/supabase/scores";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get("game");
  const limit = Number(searchParams.get("limit") ?? "12");
  if (!gameId) {
    return Response.json({ error: "Falta el parámetro game" }, { status: 400 });
  }
  const supabase = await createClient();
  const scores = await getTopScores(supabase, gameId, limit);
  return Response.json(scores);
}
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { gameId, playerName, score } = body as {
    gameId?: string;
    playerName?: string;
    score?: number;
  };
  if (
    typeof gameId !== "string" ||
    gameId.trim().length === 0 ||
    typeof playerName !== "string" ||
    playerName.trim().length === 0 ||
    typeof score !== "number" ||
    !Number.isInteger(score) ||
    score < 0
  ) {
    return Response.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const supabase = await createClient();
  await insertScore(supabase, {
    gameId,
    playerName: playerName.trim().slice(0, 32),
    score,
  });
  return Response.json({ ok: true }, { status: 201 });
}
