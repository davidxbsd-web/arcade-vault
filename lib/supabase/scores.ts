import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScoreRow } from "@/lib/data";
type ScoreDbRow = {
  player_name: string;
  score: number;
  created_at: string;
};
function toScoreRow(row: ScoreDbRow, rank: number): ScoreRow {
  const date = new Date(row.created_at);
  const day = String(date.getDate()).padStart(2, "0");
  const mon = String(date.getMonth() + 1).padStart(2, "0");
  return {
    rank,
    name: row.player_name,
    score: row.score,
    date: `${day}/${mon}/${date.getFullYear()}`,
  };
}
export async function getTopScores(
  supabase: SupabaseClient,
  gameId: string,
  limit: number,
): Promise<ScoreRow[]> {
  const { data, error } = await supabase
    .from("scores")
    .select("player_name, score, created_at")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as ScoreDbRow[]).map((row, i) => toScoreRow(row, i + 1));
}
export async function insertScore(
  supabase: SupabaseClient,
  input: { gameId: string; playerName: string; score: number },
): Promise<void> {
  const { error } = await supabase.from("scores").insert({
    game_id: input.gameId,
    player_name: input.playerName,
    score: input.score,
  });
  if (error) throw error;
}
