import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export async function GET() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      },
      { status: 503 },
    );
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getUser();
    // Una sesión ausente ("Auth session missing") no es un fallo de conexión.
    if (error && error.name !== "AuthSessionMissingError") {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
