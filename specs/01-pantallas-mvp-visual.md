# 01 — Pantallas MVP visual

- **Estado:** Aprobado
- **Depende de:** ninguno
- **Fecha:** 2026-08-12
- **Objetivo:** Implementar, solo a nivel visual y sin lógica de juego real, las cinco pantallas del MVP de Arcade Vault (Biblioteca, Detalle de juego, Reproductor, Salón de la Fama y Auth) migrando los templates de referencia a Next.js 16 App Router con rutas reales en español.

## Alcance

**Incluye:**
- Migración de las 5 pantallas de `references/templates/*.jsx` a componentes de Next.js (App Router, TypeScript, Server/Client Components según corresponda):
  - **Biblioteca** (`/biblioteca`) — grilla de juegos con búsqueda, filtro por categoría y hero.
  - **Detalle de juego** (`/juegos/[id]`) — info del juego, tabla de mejores puntuaciones, CTA a jugar.
  - **Reproductor / Jugar** (`/jugar/[id]`) — HUD (jugador, puntuación, vidas, nivel), pantalla CRT simulada, controles de pausa/fin, modal de fin de partida con guardado de puntuación.
  - **Salón de la Fama** (`/salon`) — pestañas por juego, podio top 3, tabla de ranking.
  - **Auth** (`/auth`) — tabs iniciar sesión / crear cuenta, formulario, botón "jugar como invitado", botones sociales decorativos.
- Nav global (`/`, redirige o sirve como layout con el componente `Nav`) y footer, presentes en todas las pantallas.
- Port íntegro de `references/templates/styles.css` (~950 líneas, tema pixel/neón) como hoja de estilos global, reemplazando el `app/globals.css` boilerplate actual.
- Datos mock estáticos portados a `lib/data.ts` (`GAMES`, `CATS`, `PLAYERS`, `seededScores()`), sin backend ni API.
- Simulación visual del Reproductor tal como en el template: el marcador sube solo con un `setInterval`, hay pausa, fin de partida manual, y el botón "GUARDAR PUNTUACIÓN" escribe en `localStorage` (`av_scores`) — es una demo de cómo se vería la pantalla jugando, no un juego real.
- Estado "invitado" fijo en toda la app: no hay sesión de usuario real ni persistida.

**No incluye (fuera de alcance):**
- Ningún juego jugable real (Bloque Buster, Caída, Serpentina, etc.) — los "juegos" son solo tarjetas/datos mock, no hay canvas ni lógica de gameplay.
- Autenticación funcional: el formulario de Auth no valida credenciales, no crea usuarios reales, y no persiste sesión (`av_user` de localStorage del template **no** se implementa). Enviar el formulario no cambia el estado global de la app.
- Login social real (Google/GitHub) — los botones son decorativos, sin integración OAuth.
- Estado de usuario logueado visible en Nav, Reproductor o Salón de la Fama — esas pantallas siempre muestran la variante "invitado" (Nav con botón "Iniciar Sesión", Reproductor con nombre "INVITADO", Salón de la Fama sin la fila "▸ TU MEJOR MARCA").
- Backend, base de datos o API real — todos los datos son mock estáticos en código.
- Responsive/accesibilidad más allá de lo que ya trae el CSS portado del template.
- Cualquier característica no presente en los templates de referencia (multijugador, perfiles, tienda de créditos funcional, etc.) — el contador de créditos ("CRÉDITOS · 03") queda como texto estático no funcional.

## Modelo de datos

No se introduce un modelo de datos persistente (no hay backend). Se portan estructuras mock estáticas a `lib/data.ts`, equivalentes a `references/templates/data.jsx`:

- `GAMES: Game[]` — array de juegos con `id, title, short, long, cat, cover, color, best, plays`.
- `CATS: string[]` — categorías de filtro (`TODOS, ARCADE, PUZZLE, SHOOTER, VERSUS`).
- `PLAYERS: string[]` — nombres usados para generar rankings mock.
- `seededScores(seed: number, count?: number): ScoreRow[]` — generador determinista de filas de ranking (`rank, name, score, date`), igual al template.

Tipos TypeScript (`Game`, `ScoreRow`) se definen junto a estos datos en `lib/data.ts`.

Persistencia real vía `localStorage` limitada a una sola clave: `av_scores`, escrita únicamente por el botón "GUARDAR PUNTUACIÓN" del Reproductor (simulación visual, no se lee de vuelta en ninguna otra pantalla).

## Plan de implementación

1. **Preparar layout base y estilos.** Portar `references/templates/styles.css` a `app/globals.css` (reemplazando el contenido boilerplate actual), y ajustar `app/layout.tsx` para cargar la fuente/estilos pixel-neón necesarios. El sistema queda funcional con el layout boilerplate por debajo del nuevo CSS.
2. **Componente Nav + footer en el layout raíz.** Crear `components/Nav.tsx` (client component, siempre en estado "invitado": botón "Iniciar Sesión" que navega a `/auth`, menú móvil con hamburguesa) y montarlo junto al footer en `app/layout.tsx` para que aparezcan en todas las rutas.
3. **Datos mock.** Crear `lib/data.ts` con `GAMES`, `CATS`, `PLAYERS`, `seededScores()` y los tipos `Game`/`ScoreRow`, portados de `data.jsx`.
4. **Pantalla Biblioteca (`/biblioteca`).** Crear `app/biblioteca/page.tsx` con hero, buscador, chips de categoría y grilla de `GameCard` (con efecto tilt al hover), portado de `biblioteca.jsx`. Actualizar `app/page.tsx` para redirigir a `/biblioteca` (o servir como alias).
5. **Pantalla Detalle (`/juegos/[id]`).** Crear `app/juegos/[id]/page.tsx` con info del juego, tags, stat-strip y leaderboard (`seededScores`), portado de `detalle.jsx`. Ruta no encontrada (`id` inválido) muestra 404 estándar de Next.js.
6. **Pantalla Reproductor (`/jugar/[id]`).** Crear `app/jugar/[id]/page.tsx` (client component) con HUD, pantalla CRT, controles de pausa/fin, y modal de fin de partida con guardado en `localStorage`, portado de `reproductor.jsx`. Nombre de jugador siempre inicia como "INVITADO" (sin estado de usuario).
7. **Pantalla Salón de la Fama (`/salon`).** Crear `app/salon/page.tsx` con tabs por juego, podio y tabla de ranking, portado de `salon.jsx`. Sin fila "tu mejor marca" (no hay usuario).
8. **Pantalla Auth (`/auth`).** Crear `app/auth/page.tsx` con tabs iniciar sesión/crear cuenta, formulario, botón "jugar como invitado" y botones sociales decorativos, portado de `auth.jsx`. Ningún submit cambia estado global ni navega con sesión iniciada; puede navegar de vuelta a `/biblioteca` sin persistir usuario.
9. **Verificación visual final.** Recorrer las 5 rutas en el navegador comparando con `references/templates/Arcade Vault.html`, confirmar que no hay errores de consola y que `npm run build` pasa.

## Criterios de aceptación

- [ ] `/biblioteca` renderiza el hero, buscador funcional (filtra por texto), chips de categoría funcionales (filtran por categoría) y grilla de tarjetas de juego con datos de `GAMES`.
- [ ] Cada tarjeta de juego navega a `/juegos/[id]` al hacer click (en la tarjeta o en el botón "JUGAR").
- [ ] `/juegos/[id]` muestra info del juego correcto, tabla de mejores puntuaciones generada con `seededScores`, y botones "JUGAR AHORA" (→ `/jugar/[id]`) y "VOLVER AL VAULT" (→ `/biblioteca`).
- [ ] `/jugar/[id]` muestra el HUD con jugador "INVITADO", puntuación que se incrementa sola cada ~220ms, botones Pausa/Fin/Salir funcionales, y al pulsar "FIN" se abre el modal de fin de partida.
- [ ] En el modal de fin de partida, guardar la puntuación escribe una entrada en `localStorage` bajo `av_scores` y muestra el mensaje de confirmación; los botones "JUGAR DE NUEVO" y "VOLVER AL VAULT" funcionan.
- [ ] `/salon` muestra tabs por cada juego de `GAMES`, y al cambiar de tab se regenera el podio (top 3) y la tabla de ranking (12 filas) sin la fila "tu mejor marca".
- [ ] `/auth` muestra los tabs "Iniciar sesión"/"Crear cuenta" (el segundo agrega el campo correo), el botón "Jugar como invitado", y los botones sociales decorativos; ningún envío del formulario persiste usuario ni cambia el Nav.
- [ ] El Nav aparece en las 5 pantallas, siempre en estado "invitado" (botón "Iniciar Sesión"), con links a Biblioteca y Salón de la Fama funcionales, y el menú móvil (hamburguesa) abre/cierra correctamente.
- [ ] Los estilos visuales (neón, CRT, pixel font, animaciones) coinciden con `references/templates/Arcade Vault.html` al comparar lado a lado.
- [ ] `npm run build` completa sin errores de TypeScript ni de ESLint.
- [ ] No hay errores en la consola del navegador al navegar por las 5 pantallas.

## Decisiones tomadas y descartadas

- **Rutas reales de Next.js App Router (no hash-routing SPA).** Se descarta replicar el patrón `location.hash` del template porque Next.js 16 ya provee routing de archivos nativo, más idiomático para este stack y mejor para SEO/navegación del navegador (back/forward reales).
- **URLs en español**, coherente con el resto del copy de la app (`/biblioteca`, `/juegos/[id]`, `/jugar/[id]`, `/salon`, `/auth`).
- **CSS portado tal cual** desde `styles.css` como hoja global, en vez de reescribir a utilidades Tailwind. Motivo: ~950 líneas de estilos ya pulidos (glow, scanlines, animaciones CRT) que se traducirían con alto riesgo de pérdida de fidelidad visual y mucho esfuerzo sin beneficio funcional en un MVP visual.
- **Simulación del Reproductor mantenida tal cual** (marcador que sube solo, pausa, fin de partida, guardado de puntuación en localStorage), aunque no exista un juego real detrás — es la pantalla que demuestra visualmente "cómo se vería jugando".
- **Sin autenticación funcional ni estado de usuario persistido.** El formulario de Auth es solo UI: no guarda nada en localStorage, no crea un "usuario logueado", y todas las pantallas (Nav, Reproductor, Salón de la Fama) se quedan siempre en su variante "invitado". Se descarta portar `av_user` de localStorage del template.
- **Botones de login social (Google/GitHub) decorativos**, sin integración OAuth, igual que en el template — están fuera de alcance de un MVP visual.
- **Datos mock estáticos en `lib/data.ts`**, sin backend ni API — no hay necesidad de persistencia real para un MVP puramente visual.
