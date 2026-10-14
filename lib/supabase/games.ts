import type { SupabaseClient } from "@supabase/supabase-js";
import type { Game } from "@/lib/data";
export async function getGames(supabase: SupabaseClient): Promise<Game[]> {
  const { data, error } = await supabase.from("games").select("*");
  if (error) throw error;
  return data as Game[];
}
export async function getGameById(
  supabase: SupabaseClient,
  id: string,
): Promise<Game | null> {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Game | null;
}
