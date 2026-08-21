import { notFound } from "next/navigation";
import { GAMES } from "@/lib/data";
import Reproductor from "@/components/Reproductor";

export default async function JugarPage({ params }: PageProps<"/jugar/[id]">) {
  const { id } = await params;
  const game = GAMES.find((g) => g.id === id);
  if (!game) notFound();

  return <Reproductor game={game} />;
}
