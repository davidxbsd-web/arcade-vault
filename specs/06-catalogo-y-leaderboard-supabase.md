# 06 — Catálogo de juegos y leaderboard en Supabase

- **Estado:** Aprobado
- **Depende de:** SPEC 01, SPEC 02, SPEC 04, SPEC 05
- **Fecha:** 2026-10-13
- **Objetivo:** Mover el catálogo de juegos (`GAMES`) y las puntuaciones reales de Asteroids a dos tablas de Supabase (`games` y `scores`), para que `/biblioteca`, `/salon`, `/juegos/[id]` y `/jugar/[id]` lean el catálogo desde la base de datos y el leaderboard de Asteroids muestre partidas reales en vez de datos simulados.

## Por qué existe esta spec

Hoy `GAMES` vive hardcodeado en `lib/data.ts` y `/salon` muestra puntuaciones inventadas con `seededScores()`; la única partida real (Asteroids, SPEC 05) solo guarda su puntuación en `localStorage` (`av_scores`), sin leerla de vuelta en ningún sitio. SPEC 04 dejó explícitamente fuera "tablas, migraciones y RLS" y "migrar `GAMES`... a la base de datos" para una spec posterior. Esta es esa spec.

Se decidió combinarla en un solo documento (tabla de juegos + leaderboard) en vez de dividirla en dos specs, por decisión explícita del usuario — ver sección de decisiones.

## Alcance

**Incluye:**

- **Tabla `games`** en Supabase, con las mismas columnas que el tipo `Game` actual: `id text primary key`, `title text`, `short text`, `long text`, `cat text`, `cover text`, `color text`, `best integer`, `plays text`. RLS: `SELECT` público (anon + authenticated); sin `INSERT`/`UPDATE`/`DELETE` permitidos desde el cliente (no hay UI de administración de juegos).
- **Seed de `games`:** la misma migración inserta los 9 registros que hoy están en el array `GAMES` de `lib/data.ts`, con sus valores actuales (incluye `best`/`plays` como placeholders estáticos, igual que hoy).
- **Tabla `scores`**, con columnas: `id uuid primary key default gen_random_uuid()`, `game_id text references games(id)`, `player_name text`, `score integer`, `created_at timestamptz default now()`. RLS: `SELECT` público; `INSERT` público abierto (sin auth, cualquiera puede insertar una fila, igual nivel de confianza que `localStorage` hoy); sin `UPDATE`/`DELETE` desde el cliente.
- **Migración SQL** en `supabase/migrations/20261013000000_games_and_scores.sql` (DDL de ambas tablas + políticas RLS + `INSERT` de seed), aplicada al proyecto remoto con la herramienta MCP `mcp__supabase__apply_migration` y versionada en el repo como referencia.
- **`lib/supabase/games.ts`:** `getGames(supabase)` y `getGameById(supabase, id)`, tipados con `Game`, reciben el cliente (browser o server) como parámetro para servir tanto a páginas cliente como servidor.
- **`lib/supabase/scores.ts`:** `getTopScores(supabase, gameId, limit)` (ordenado por `score` descendente) e `insertScore(supabase, { gameId, playerName, score })`.
- **`app/api/scores/route.ts`:** route handler con `GET` (query params `game` y `limit`, devuelve el top de `scores` para ese `game_id`) y `POST` (body `{ gameId, playerName, score }`, inserta una fila). Validación básica en el `POST`: `score` entero `>= 0`, `playerName` no vacío y recortado a 32 caracteres. `export const dynamic = "force-dynamic"`.
- **`lib/data.ts`:** se elimina el array `GAMES` (pasa a vivir en Supabase). Se mantienen `Game`, `ScoreRow`, `PLAYERS`, `seededScores()` y `CATS` — siguen usándose para los 8 juegos que quedan como mock.
- **`app/biblioteca/page.tsx`:** sigue siendo `"use client"`; reemplaza el import de `GAMES` por un fetch en `useEffect` con `lib/supabase/client.ts` a `getGames`. Estado de carga ("CARGANDO…") y de error (mensaje simple, sin romper la página) mientras no hay respuesta.
- **`app/salon/page.tsx`:** igual patrón para poblar las tabs (`getGames`). Para la tab `asteroids`, en vez de `seededScores()` hace fetch a `/api/scores?game=asteroids&limit=12`. Para las otras 8 tabs, sigue usando `seededScores(tab.length * 23 + 7, 12)` sin cambios. Si `asteroids` tiene menos de 3 filas reales, el podio solo muestra los puestos disponibles y los slots sin dato quedan con `—`; si tiene 0 filas, el podio y la tabla se sustituyen por el mensaje "SIN PUNTUACIONES AÚN. SÉ EL PRIMERO.".
- **`app/juegos/[id]/page.tsx`:** pasa a usar `getGameById` (server, vía `lib/supabase/server.ts`) en vez de `GAMES.find`. Si `id === "asteroids"`, la sección "MEJORES PUNTUACIONES" usa `getTopScores` (server) en vez de `seededScores`; para cualquier otro `id`, sigue usando `seededScores(id.length * 17 + 3, 10)` sin cambios.
- **`app/jugar/[id]/page.tsx`:** usa `getGameById` (server) en vez de `GAMES.find`.
- **`components/Reproductor.tsx`:** el botón "GUARDAR PUNTUACIÓN" hace `POST` a `/api/scores` **solo** cuando `game.id === "asteroids"` (en vez de escribir en `localStorage`); si la petición falla, se muestra un error inline en el modal y no se marca como guardado (el usuario puede reintentar). Para cualquier otro `game.id`, el guardado sigue siendo exactamente el actual (`localStorage.av_scores`), sin cambios.

**No incluye (fuera de alcance, para specs futuras):**

- Login o autenticación para guardar una puntuación — sigue siendo anónimo con nombre, como hoy. `/auth` y `components/Nav.tsx` no se tocan.
- Persistir puntuaciones reales de los otros 8 juegos (siguen siendo mock con `setInterval`, sin lógica de juego real que produzca un número genuino).
- Recalcular `games.best` a partir del máximo real de `scores`. El badge "MEJOR PUNTUACIÓN" de `GameCard` y el detalle de `/juegos/asteroids` siguen mostrando el valor estático de la columna `games.best`, igual que los otros 8 juegos.
- UI de administración para crear, editar o borrar juegos. Los 9 registros de `games` solo cambian vía migración SQL.
- Instalar la CLI de Supabase ni montar un stack local de desarrollo (`supabase start`). Se trabaja contra el proyecto remoto ya configurado (SPEC 04), vía MCP.
- Anti-abuso / rate limiting en `/api/scores` más allá de la validación básica de tipo y longitud descrita arriba. El `INSERT` público queda abierto, igual de expuesto que `localStorage` lo estaba hoy.
- Convertir `/biblioteca` o `/salon` en Server Components. Siguen siendo `"use client"`, ahora con fetch al cliente browser de Supabase en vez de un array estático.
- Tipos TypeScript generados automáticamente del esquema (`Database`). Se tipa a mano con `Game`/`ScoreRow` existentes.
- Tests automatizados (no hay runner en el repo).
- Sonido, controles táctiles o cualquier cambio de jugabilidad de Asteroids (SPEC 05 ya cerrada).

## Modelo de datos

```sql
-- supabase/migrations/20261013000000_games_and_scores.sql

create table public.games (
  id text primary key,
  title text not null,
  short text not null,
  long text not null,
  cat text not null,
  cover text not null,
  color text not null,
  best integer not null,
  plays text not null
);

alter table public.games enable row level security;
create policy "games_select_public" on public.games
  for select to anon, authenticated using (true);
-- Sin políticas de insert/update/delete: solo se modifica vía migraciones.

create table public.scores (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references public.games(id),
  player_name text not null,
  score integer not null,
  created_at timestamptz not null default now()
);

alter table public.scores enable row level security;
create policy "scores_select_public" on public.scores
  for select to anon, authenticated using (true);
create policy "scores_insert_public" on public.scores
  for insert to anon, authenticated with check (true);
-- Sin políticas de update/delete.

insert into public.games (id, title, short, long, cat, cover, color, best, plays) values
  ('bloque-buster', 'BLOQUE BUSTER', '…', '…', 'ARCADE', 'cover-bricks', 'cyan', 28450, '12.4K'),
  -- … los 9 registros actuales de GAMES en lib/data.ts, copiados tal cual.
  ('asteroids', 'ASTEROIDS', '…', '…', 'SHOOTER', 'cover-rocas', 'yellow', 39750, '10.2K');
```

```ts
// lib/supabase/games.ts
export async function getGames(supabase: SupabaseClient): Promise<Game[]> {
  /* select * from games */
}
export async function getGameById(
  supabase: SupabaseClient,
  id: string,
): Promise<Game | null> {
  /* … */
}

// lib/supabase/scores.ts
export async function getTopScores(
  supabase: SupabaseClient,
  gameId: string,
  limit: number,
): Promise<ScoreRow[]> {
  /* order by score desc */
}
export async function insertScore(
  supabase: SupabaseClient,
  input: { gameId: string; playerName: string; score: number },
): Promise<void> {
  /* … */
}
```

```ts
// app/api/scores/route.ts
type ScoresGetResponse = ScoreRow[];
type ScoresPostBody = { gameId: string; playerName: string; score: number };
```

`lib/data.ts` conserva sin cambios: `type Game`, `type ScoreRow`, `PLAYERS`, `seededScores()`, `CATS`. Solo se elimina el array `GAMES`.

## Plan de implementación

1. **Migración SQL.** Crear `supabase/migrations/20261013000000_games_and_scores.sql` con las tablas `games`/`scores`, sus políticas RLS y el `INSERT` de seed con los 9 juegos actuales. Aplicarla al proyecto remoto con `mcp__supabase__apply_migration`. Verificar con `mcp__supabase__list_tables` y una consulta de `select * from games` que devuelve 9 filas. `npm run build` sigue pasando (nada en el código la usa todavía).
2. **Helpers de datos.** Crear `lib/supabase/games.ts` (`getGames`, `getGameById`) y `lib/supabase/scores.ts` (`getTopScores`, `insertScore`), tipados con `Game`/`ScoreRow`. Sin uso todavía; `npm run build` y `npx eslint` pasan.
3. **Route handler de scores.** Crear `app/api/scores/route.ts` con `GET`/`POST` usando el cliente de servidor (`lib/supabase/server.ts`) y los helpers del paso 2, con la validación básica descrita en el alcance. Probar con `curl`: `GET /api/scores?game=asteroids` devuelve `[]`, un `POST` inserta una fila y el siguiente `GET` la refleja.
4. **Migrar `lib/data.ts`.** Quitar el array `GAMES`. Confirmar que nada más en el repo lo importa sin haber sido actualizado en los pasos siguientes (`npm run build` fallará mientras no se completen los pasos 5–7; es esperado en este punto intermedio).
5. **Páginas de servidor.** Actualizar `app/juegos/[id]/page.tsx` y `app/jugar/[id]/page.tsx` para usar `getGameById` (server) en vez de `GAMES.find`. En `/juegos/[id]`, si `id === "asteroids"` usar `getTopScores` (server) en vez de `seededScores`; cualquier otro `id` sigue con `seededScores`. `npm run build` vuelve a pasar.
6. **Páginas de cliente.** Actualizar `app/biblioteca/page.tsx` y `app/salon/page.tsx` para poblar `games` con un fetch (`useEffect` + `lib/supabase/client.ts` + `getGames`), con estado de carga/error. En `/salon`, la tab `asteroids` hace fetch a `/api/scores?game=asteroids&limit=12` y maneja los casos de 0/1/2 resultados (placeholders `—` en el podio, o el mensaje de "sin puntuaciones" si hay 0); las otras 8 tabs siguen con `seededScores`.
7. **Reproductor.** Cablear "GUARDAR PUNTUACIÓN" para `game.id === "asteroids"` a un `POST /api/scores`, con manejo de error inline (el modal no se cierra ni marca como guardado si falla); el resto de juegos sigue escribiendo en `localStorage.av_scores` sin cambios.
8. **Verificación manual end-to-end.** `npm run dev`. Comprobar que `/biblioteca` y `/salon` cargan los 9 juegos desde Supabase (no desde `lib/data.ts`). Jugar una partida de Asteroids en `/jugar/asteroids`, perder las 3 vidas, "GUARDAR PUNTUACIÓN" y confirmar (vía `mcp__supabase__execute_sql` o la propia UI) que aparece una fila nueva en `scores`. Recargar `/salon`, tab ASTEROIDS, y ver esa puntuación reflejada en el podio/tabla ordenada por puntuación. Confirmar que `/jugar/rocas` (u otro mock) sigue guardando en `localStorage` sin tocar Supabase. `npm run build` y `npx eslint` pasan sin errores.

## Criterios de aceptación

- [ ] Las tablas `games` y `scores` existen en el proyecto Supabase remoto, con las políticas RLS descritas (lectura pública en ambas, inserción pública solo en `scores`).
- [ ] `select * from games` devuelve exactamente los 9 juegos que hoy están en `GAMES` de `lib/data.ts`, con los mismos valores.
- [ ] `lib/data.ts` ya no exporta un array `GAMES`; sigue exportando `Game`, `ScoreRow`, `PLAYERS`, `seededScores` y `CATS`.
- [ ] `/biblioteca` renderiza los 9 juegos obtenidos de Supabase (no de un array estático en el bundle).
- [ ] `/salon` puebla sus tabs desde Supabase; la tab ASTEROIDS muestra puntuaciones reales de la tabla `scores` ordenadas de mayor a menor, y las otras 8 tabs siguen mostrando `seededScores()` sin regresión visual.
- [ ] Si la tabla `scores` tiene menos de 3 filas para `asteroids`, el podio de `/salon` no rompe (muestra `—` en los puestos sin dato) ni lanza un error en consola; con 0 filas se muestra el mensaje de "sin puntuaciones aún".
- [ ] `/juegos/asteroids` muestra en "MEJORES PUNTUACIONES" datos reales de `scores`; `/juegos/<otro-id>` sigue mostrando `seededScores()`.
- [ ] `/jugar/asteroids` y `/jugar/<otro-id>` resuelven el juego vía `getGameById` contra Supabase (un `notFound()` para un `id` inexistente sigue funcionando).
- [ ] En el Reproductor, jugar Asteroids y pulsar "GUARDAR PUNTUACIÓN" inserta una fila en `scores` con `{ game_id: "asteroids", player_name, score }`, visible en `/salon` tras recargar.
- [ ] Si el `POST` a `/api/scores` falla (p. ej. red caída), el modal muestra un error y no marca la puntuación como guardada; no rompe la página.
- [ ] Guardar la puntuación de cualquier juego mock (`id !== "asteroids"`) sigue escribiendo en `localStorage.av_scores` exactamente como hoy, sin llamar a `/api/scores`.
- [ ] `npm run build` completa sin errores de TypeScript ni de ESLint; no hay errores en la consola del navegador en `/biblioteca`, `/salon`, `/juegos/asteroids` ni `/jugar/asteroids`.

## Decisiones tomadas y descartadas

- **Spec combinada (tabla de juegos + leaderboard) en un solo documento.** Se propuso dividirla en dos specs independientes (una por tabla); el usuario decidió explícitamente mantenerla combinada. El plan de implementación respeta el orden sugerido (games primero, scores/leaderboard después) dentro del mismo documento.
- **Todas las pantallas (`/biblioteca`, `/salon`, `/juegos`, Reproductor) leen `games` desde Supabase**, no solo una pantalla piloto. Evita tener el catálogo en dos fuentes de verdad a la vez.
- **Columnas de `games` idénticas al tipo `Game` actual**, incluyendo `best`/`plays` como placeholders estáticos. No se recalculan desde datos reales en esta spec.
- **Solo Asteroids tiene puntuaciones reales en `scores`.** Es el único juego jugable de verdad (SPEC 05); los otros 8 siguen siendo fichas mock y no se les persiste nada real.
- **Supabase reemplaza `localStorage` para Asteroids**, no conviven. Simplifica el flujo de guardado y evita decidir cuál fuente manda si difieren.
- **Guardado anónimo, sin Supabase Auth.** Coherente con que `/auth` no existe todavía (fuera de alcance de SPEC 04); el modal sigue pidiendo nombre/iniciales como hoy.
- **`INSERT` público abierto en `scores`, sin validación anti-abuso más allá de tipos/longitud.** Mismo nivel de confianza que tenía `localStorage` (cualquiera podía escribir cualquier valor); un sistema anti-cheat o rate limiting es una spec aparte si se necesita.
- **Migración aplicada vía MCP de Supabase (`apply_migration`)**, no vía CLI local. No hay `supabase/` ni CLI instalada en este entorno; el SQL queda versionado en el repo como referencia aunque se aplique por MCP.
- **`/biblioteca` y `/salon` siguen siendo `"use client"`** con fetch al cliente browser de Supabase, en vez de reescribirse como Server Component + Client Component hijo. Cambio mínimo sobre el patrón ya existente (tabs/filtros con estado).
- **Esquema de `scores` sin columna `rank` persistida.** El rango se deriva en la consulta (`order by score desc`) y en la UI, igual que hace hoy `seededScores()`.

## Riesgos identificados

| Riesgo                                                                                                 | Mitigación                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `INSERT` público en `scores` permite puntuaciones falsas o spam                                        | Aceptado como en el paso 1 de alcance: mismo nivel de exposición que `localStorage` hoy; anti-abuso queda para una spec futura si se necesita.     |
| Menos de 3 filas reales en `scores` rompe el indexado fijo (`rows[0]`, `rows[1]`, `rows[2]`) del podio | Paso 6 del plan: render defensivo con placeholders `—` o mensaje de "sin puntuaciones", cubierto en criterios de aceptación.                       |
| Fetch a Supabase falla en `/biblioteca` o `/salon` (red, RLS mal configurada)                          | Estado de error explícito en cada página; no se deja la pantalla en blanco ni se rompe el render del resto de la UI.                               |
| `lib/data.ts` sin `GAMES` deja el build roto durante el paso 4 hasta completar los pasos 5–7           | Documentado como esperado en el propio plan; los pasos se implementan y verifican en la misma sesión, no se deja a medias en un commit intermedio. |

## Lo que **no** entra en esta spec

- Login o autenticación para guardar puntuaciones.
- Puntuaciones reales de los 8 juegos que siguen siendo mock.
- Recalcular `games.best` desde `scores` reales.
- UI de administración de juegos.
- CLI de Supabase local / stack de desarrollo local.
- Anti-abuso o rate limiting más allá de validación básica de tipos.
- Tipos `Database` generados automáticamente.
- Tests automatizados.

Cada uno, si llega, va en su propia spec.
