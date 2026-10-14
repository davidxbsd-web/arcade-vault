import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGameById } from "@/lib/supabase/games";
import Reproductor from "@/components/Reproductor";
export default async function JugarPage({ params }: PageProps<"/jugar/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const game = await getGameById(supabase, id);
  if (!game) notFound();
  return <Reproductor game={game} />;
}
