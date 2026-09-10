# 04 — Conexión con Supabase

- **Estado:** Aprobado
- **Depende de:** —
- **Fecha:** 2026-09-09
- **Objetivo:** Instalar los paquetes de Supabase, crear los helpers de cliente server/browser y las dos variables públicas de entorno, y exponer un route handler `/api/supabase/health` que confirme que la conexión al proyecto funciona.

## Por qué existe esta spec

Arcade Vault va a necesitar Supabase para auth, perfiles y puntuaciones reales, pero eso llega en specs posteriores. Esta spec deja solo los cimientos: dependencias, configuración de entorno y una comprobación de conectividad verificable. No cablea ninguna pantalla ni introduce esquema de base de datos.

## Alcance

**Incluye:**

- Nuevas dependencias en `package.json`: `@supabase/supabase-js` y `@supabase/ssr` (patrón oficial para Next.js App Router).
- Dos variables públicas de entorno, con prefijo `NEXT_PUBLIC_` porque el cliente browser las necesita:
  - `NEXT_PUBLIC_SUPABASE_URL` = `https://fxjkniebncdtryidhcsl.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = la publishable key del proyecto (`sb_publishable_...`), no la legacy anon JWT.
- `.env.example` (versionado): se añaden las dos variables con la URL real y la key vacía, más un comentario con el enlace al dashboard.
- `.env.local` (no versionado): las dos variables con sus valores reales para desarrollo.
- `lib/supabase/client.ts`: helper `createClient()` para componentes de cliente, usando `createBrowserClient` de `@supabase/ssr` y las dos variables `NEXT_PUBLIC_`.
- `lib/supabase/server.ts`: helper `createClient()` async para código de servidor (route handlers, server components, server actions), usando `createServerClient` de `@supabase/ssr` con `cookies()` de `next/headers` (patrón `getAll`/`setAll`, con `setAll` envuelto en try/catch para contextos de solo lectura).
- `app/api/supabase/health/route.ts`: route handler `GET` que crea el cliente de servidor, hace una llamada ligera (`supabase.auth.getUser()`), y responde:
  - `200` con `{ "ok": true }` si la llamada no arroja error de red ni de configuración (una sesión ausente **no** es error).
  - `503` con `{ "ok": false, "error": string }` si faltan las variables de entorno o la llamada falla por conectividad/credenciales.
  - `export const dynamic = "force-dynamic"` para que nunca se cachee.

**No incluye (fuera de alcance, para specs futuras):**

- Cualquier funcionalidad de login, registro, logout o sesión — `/auth` y `components/Nav.tsx` no se tocan.
- Middleware de refresco de sesión (`middleware.ts`).
- Tablas, migraciones y RLS — no se crea la carpeta `supabase/migrations/` ni se aplica SQL al proyecto.
- Migrar `GAMES`, `PLAYERS` o `seededScores` de `lib/data.ts` a la base de datos.
- Cambios en `/salon`, `/jugar`, `/biblioteca` o cualquier otra pantalla.
- Tipos TypeScript generados del esquema (`Database`) — no hay esquema todavía.
- `SUPABASE_DB_PASSWORD` en `.env.example`: ya está presente de un commit previo; se deja como está.

## Modelo de datos

Esta spec no introduce estructuras de datos ni esquema en Supabase. Solo configuración de entorno:

```txt
# .env.local (no versionado) y plantilla en .env.example
NEXT_PUBLIC_SUPABASE_URL=https://fxjkniebncdtryidhcsl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxx   # publishable key, dashboard > API Keys
```

Respuesta del route handler:

```ts
type HealthResponse = { ok: true } | { ok: false; error: string };
```

## Plan de implementación

1. **Dependencias.** `npm install @supabase/supabase-js @supabase/ssr`. `npm run build` sigue pasando (aún sin usar los paquetes).
2. **Variables de entorno.** Añadir `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` a `.env.example` (URL real, key vacía, comentario con enlace al dashboard) y a `.env.local` con los valores reales (URL + publishable key `sb_publishable_...`).
3. **Helper browser.** Crear `lib/supabase/client.ts` con `createClient()` usando `createBrowserClient` y las dos variables `NEXT_PUBLIC_`.
4. **Helper server.** Crear `lib/supabase/server.ts` con `createClient()` async usando `createServerClient`, `cookies()` de `next/headers` y el patrón `getAll`/`setAll` (con `setAll` en try/catch).
5. **Route handler de salud.** Crear `app/api/supabase/health/route.ts` con `GET` que usa el helper de servidor, llama a `supabase.auth.getUser()`, y devuelve `200 { ok: true }` o `503 { ok: false, error }`. Añadir `export const dynamic = "force-dynamic"`.
6. **Verificación.** Con `.env.local` completo, `npm run dev` y `curl -s -w "\n%{http_code}" http://localhost:3000/api/supabase/health` devuelve `{"ok":true}` y `200`. Borrar temporalmente `NEXT_PUBLIC_SUPABASE_ANON_KEY` y confirmar `503` con `ok:false`. Restaurar. `npm run build` y `npx eslint` pasan.

## Criterios de aceptación

- [ ] `@supabase/supabase-js` y `@supabase/ssr` aparecen en `dependencies` de `package.json` y están instalados.
- [ ] `.env.example` (versionado) contiene `NEXT_PUBLIC_SUPABASE_URL` con la URL real y `NEXT_PUBLIC_SUPABASE_ANON_KEY` vacía, con un comentario que indica de dónde sacar la key.
- [ ] `.env.local` contiene ambas variables con valores reales y **no** está versionado.
- [ ] Existen `lib/supabase/client.ts` y `lib/supabase/server.ts`, cada uno exportando `createClient`.
- [ ] `GET http://localhost:3000/api/supabase/health` con las variables bien puestas responde `200` y body `{"ok":true}`.
- [ ] `GET` al mismo endpoint con una variable de Supabase ausente o vacía responde `503` y body `{"ok":false,"error":...}` sin tumbar el servidor.
- [ ] `/auth`, `components/Nav.tsx`, `/salon`, `/jugar`, `/biblioteca` y `lib/data.ts` quedan sin cambios.
- [ ] `npm run build` completa sin errores de TypeScript ni de ESLint.

## Decisiones tomadas y descartadas

- **Sí:** `@supabase/ssr` desde ya, aunque no haya auth. Es el patrón idiomático de Next.js App Router y evita reescribir los helpers cuando llegue el login.
- **No:** solo `@supabase/supabase-js`. Más simple ahora pero obliga a rehacer los clientes después.
- **Sí:** route handler `/api/supabase/health` para la comprobación (elección del usuario). Es verificable con `curl` y no ensucia la UI.
- **No:** una página `/demos/supabase` o un script temporal. La página añade ruido visual; el script no deja nada reutilizable en el repo.
- **Sí:** publishable key (`sb_publishable_...`) en vez de la legacy anon JWT. Es la recomendada por Supabase (rotación independiente, mejor seguridad) y ambas están activas en el proyecto.
- **No:** carpeta `supabase/migrations/` ni SQL aplicado al proyecto. Sin esquema en esta spec; decisión explícita del usuario.
- **No:** funcionalidad de login. Fuera de alcance; va en una spec posterior sobre Supabase Auth.
- **`auth.getUser()` como sonda de conectividad.** Hace una llamada real al servidor de auth de Supabase; una sesión ausente no cuenta como error, pero una URL/key mala o un fallo de red sí.

## Riesgos identificados

| Riesgo                                                                       | Mitigación                                                                                                                       |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Variables `NEXT_PUBLIC_` ausentes en un entorno nuevo (deploy, otra máquina) | El route handler devuelve `503 { ok: false }` con el detalle en vez de romper; `.env.example` documenta ambas.                   |
| Confundir la publishable key con la legacy anon JWT                          | La spec fija el valor esperado (`sb_publishable_...`) y el comentario de `.env.example` apunta al dashboard.                     |
| La publishable key queda expuesta en el bundle del cliente                   | Es su comportamiento esperado y seguro: es una clave pública protegida por RLS. No se usa ninguna service_role key en esta spec. |

## Lo que **no** entra en esta spec

- Login, registro, logout, sesión y middleware.
- Tablas, migraciones, RLS y tipos generados del esquema.
- Migrar datos de `lib/data.ts` a Supabase.
- Cambios en cualquier pantalla existente.

Cada uno, si llega, va en su propia spec.
