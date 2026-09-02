# 02 — Pantalla Juegos (landing)

- **Estado:** Approved
- **Depende de:** SPEC 01
- **Fecha:** 2026-09-01
- **Objetivo:** Crear la pantalla `/juegos` (hoy inexistente y con error 400) como landing page de Arcade Vault, portando `references/templates/home-about/home.jsx` sin su sección de About/Acerca de, y convertirla en la nueva puerta de entrada del sitio.

## Alcance

**Incluye:**

- Nueva ruta `app/juegos/page.tsx` que renderiza una landing equivalente a `home.jsx`, con estas secciones en el mismo orden:
  - **Hero** con eyebrow, título en 3 líneas, subtítulo, CTAs ("EXPLORAR JUEGOS" → `/biblioteca`, "CREAR CUENTA" → `/auth`) y `hero-scroll`.
  - **`FloatingSilhouettes`** (siluetas SVG decorativas flotantes) y hook **`useReveal`** (IntersectionObserver que agrega la clase `in` a los `.reveal` al hacer scroll), portados tal cual, como client component.
  - **"¿Por qué Arcade Vault?"** — grilla de 4 `feature-card` con `FeatureIcon` (GAMEPAD, FREE, TROPHY, ROCKET), igual que el template.
  - **"Juegos disponibles ahora"** — rail de `MiniCard` con los primeros 6 juegos de `GAMES` (`lib/data.ts`), cada una navega a `/juegos/[id]`; botón "VER TODOS LOS JUEGOS →" → `/biblioteca`.
  - **Stats** — 3 bloques: `${GAMES.length}+` / "JUEGOS" / "Y CONTANDO" (calculado desde `GAMES.length`), y los otros dos bloques ("MILES DE PARTIDAS", "GLOBAL RANKING") con el mismo texto fijo del template (decorativos, igual que el contador de créditos del Nav).
  - **"Actividad en vivo"** — dos tarjetas: ticker de últimas puntuaciones y top 5 jugadores del día, generados con `seededScores`/`PLAYERS` de `lib/data.ts` (ver Modelo de datos), no con arrays hardcodeados. Botón "VER SALÓN →" → `/salon`.
  - **Precios** — tarjeta de plan único gratuito con lista de beneficios y CTA "EMPEZAR GRATIS →" → `/auth`, más el bloque de FAQ (3 preguntas), portados tal cual del template (contenido estático, sin lógica de pricing real).
  - **CTA final** ("¿LISTO PARA JUGAR?") con botón "INSERTAR MONEDA →" → `/biblioteca`.
- Port de las clases CSS necesarias de `references/templates/home-about/styles.css` a `app/globals.css`, de forma **aditiva** (sin duplicar lo que ya existe: `.pulse`, `.blink`, `.flicker`, `.fade-in`, variables de color, etc. ya están portados desde la spec 01): `.home*`, `.reveal`/`.in`, `.mini-*`, `.feature-*`, `.activity-*`, `.pricing-*`, `.stat-*`, `.ft-icon`, `.final-*`, y las animaciones/keyframes propias de esas clases que falten.
- `app/page.tsx` cambia su `redirect()` de `/biblioteca` a `/juegos`: `/juegos` pasa a ser la landing de entrada del sitio.
- `components/Nav.tsx`:
  - El logo (`Link` de "ARCADE VAULT") apunta a `/juegos` en vez de `/biblioteca`.
  - Se agrega un link "Inicio" → `/juegos` (desktop y menú móvil), activo cuando `pathname === "/juegos"`.
  - `isActive("biblioteca")` deja de incluir `/juegos` en su condición (solo `/biblioteca` y `/jugar`); "Inicio" y "Biblioteca" quedan como estados activos mutuamente excluyentes.
- Estado "invitado" fijo, igual que el resto de la app (sin sesión real): los CTAs de esta pantalla no cambian ningún estado global.

**No incluye (fuera de alcance):**

- La sección **About / Acerca de** de `home-about` (`about.jsx`) — no se porta ningún contenido ni ruta relacionada con About en esta spec.
- `nav.jsx` del template `home-about` no se usa como referencia — el `Nav` de la app ya existe (portado en spec 01) y solo se ajusta puntualmente como se describe arriba.
- Cualquier lógica de pricing real (cobros, planes pagos) — la sección de precios es contenido estático decorativo, igual que en el template.
- Cambios a `/biblioteca`, `/juegos/[id]`, `/jugar/[id]`, `/salon` o `/auth` más allá de lo estrictamente necesario para los links de navegación descritos arriba.
- Responsive/accesibilidad más allá de lo que ya trae el CSS portado del template.
- Cualquier dato o sección no presente en `home.jsx` (multijugador, perfiles, etc.).

## Modelo de datos

No se introduce ningún modelo de datos nuevo. Esta pantalla reutiliza exclusivamente lo ya definido en `lib/data.ts` (spec 01):

- **Juegos disponibles ahora:** `GAMES.slice(0, 6)`.
- **Stats "JUEGOS":** `GAMES.length`.
- **Últimas puntuaciones (ticker):** generadas con `seededScores(seed, 7)` (mismo patrón que usa `/salon` para su ranking), tomando `name`/`score` de cada fila; el juego mostrado en cada fila (`g`) y el "hace X min" (`t`) se derivan de forma determinista de `GAMES` y del índice de la fila (sin nuevo estado ni librería de fechas relativas — puede ser texto fijo tipo el template si no hay forma determinista razonable de generarlo).
- **Top 5 jugadores del día:** `PLAYERS` + `seededScores`, mismo patrón que usa `/salon` para su podio/tabla (top 5 en vez de top 12).

No hay persistencia nueva en `localStorage` ni backend.

## Plan de implementación

1. **Port de CSS.** Agregar a `app/globals.css` las reglas de `references/templates/home-about/styles.css` correspondientes a `.home*`, `.reveal`/`.in`, `.mini-*`, `.feature-*`, `.ft-icon`, `.activity-*`, `.pricing-*`, `.stat-*`, `.final-*` y sus keyframes, sin duplicar las clases/variables ya presentes. El sistema sigue compilando y las pantallas existentes no cambian visualmente.
2. **Componentes de la landing.** Crear `components/juegos/` (o archivo único `app/juegos/page.tsx` con subcomponentes internos, según convenga) con: hook `useReveal`, `FloatingSilhouettes`, `MiniCard`, `FeatureIcon`, portados de `home.jsx` a TypeScript. Marcar como client component (`"use client"`) por el uso de `IntersectionObserver`.
3. **Página `/juegos`.** Crear `app/juegos/page.tsx` ensamblando las 7 secciones del alcance (Hero, Why, Juegos disponibles, Stats, Actividad en vivo, Precios, CTA final), usando `GAMES`, `seededScores` y `PLAYERS` de `lib/data.ts` para las secciones de datos, y `Link`/`useRouter` de `next/navigation` en vez del prop `navigate` del template.
4. **Redirect de la raíz.** Cambiar `app/page.tsx` para hacer `redirect("/juegos")` en vez de `redirect("/biblioteca")`.
5. **Actualizar Nav.** En `components/Nav.tsx`: logo → `/juegos`, nuevo link "Inicio" (desktop + móvil) apuntando a `/juegos`, y ajustar `isActive("biblioteca")` para que ya no incluya `/juegos`.
6. **Verificación visual final.** Recorrer `/`, `/juegos`, `/biblioteca`, `/juegos/[id]`, `/salon` en el navegador, comparando `/juegos` con `references/templates/home-about/arcade-vault-standalone.html` (sección Home), confirmar que no hay errores de consola, que los links del Nav marcan el estado activo correcto en cada ruta, y que `npm run build` pasa.

## Criterios de aceptación

- [ ] `http://localhost:3000/juegos` responde 200 y renderiza las 7 secciones descritas en el alcance (Hero, Por qué Arcade Vault, Juegos disponibles ahora, Stats, Actividad en vivo, Precios, CTA final), sin ninguna sección de About/Acerca de.
- [ ] El hero de `/juegos` muestra las siluetas flotantes decorativas y las secciones con clase `reveal` reciben la clase `in` al hacer scroll hasta ellas (comportamiento de `useReveal`).
- [ ] La sección "Juegos disponibles ahora" muestra 6 `MiniCard` de `GAMES` y cada una navega a `/juegos/[id]` correspondiente al hacer click.
- [ ] La sección Stats muestra `${GAMES.length}+` como número de juegos (coincide con `GAMES.length` real).
- [ ] La sección "Actividad en vivo" muestra el ticker de últimas puntuaciones y el top 5 de jugadores del día generados a partir de `seededScores`/`PLAYERS`, sin arrays hardcodeados de ejemplo del template.
- [ ] Los CTAs de `/juegos` navegan correctamente: "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →" e "INSERTAR MONEDA →" van a `/biblioteca`; "CREAR CUENTA" y "EMPEZAR GRATIS →" van a `/auth`; "VER SALÓN →" va a `/salon`.
- [ ] `http://localhost:3000/` redirige a `/juegos` (ya no a `/biblioteca`).
- [ ] El Nav muestra un link "Inicio" activo solo en `/juegos`, el logo navega a `/juegos`, y "Biblioteca" queda activo solo en `/biblioteca` y `/jugar/[id]` (ya no en `/juegos`).
- [ ] `npm run build` completa sin errores de TypeScript ni de ESLint.
- [ ] No hay errores en la consola del navegador al navegar por `/`, `/juegos`, `/biblioteca` y volver.

## Decisiones tomadas y descartadas

- **`/juegos` es una landing nueva, independiente de `/biblioteca`.** Se descarta fusionar `/juegos` con la grilla de `/biblioteca`: son pantallas con propósitos distintos (landing de marketing vs. exploración/búsqueda de juegos) y ambas coexisten, igual que en el template original `home-about` (donde `home.jsx` y una futura biblioteca serían páginas separadas).
- **`/` redirige a `/juegos` en vez de `/biblioteca`.** La nueva landing pasa a ser la puerta de entrada del sitio; `/biblioteca` sigue existiendo y accesible desde el Nav y desde los CTAs de `/juegos`.
- **Sin sección About.** Se excluye explícitamente `about.jsx` del port, tal como pidió el usuario — si se quiere en el futuro, será una spec separada.
- **Datos de "Actividad en vivo" generados con `seededScores`/`PLAYERS`, no hardcodeados.** Consistente con la decisión de spec 01 de no introducir datos mock nuevos fuera de `lib/data.ts`; reutiliza el mismo patrón que ya usa `/salon`.
- **Stats "JUEGOS" calculado dinámicamente (`GAMES.length`), el resto del bloque de stats queda como texto fijo decorativo**, igual criterio que el contador de créditos del Nav (spec 01): no hay backend para números reales de partidas jugadas o ranking global.
- **CSS portado de forma aditiva a `app/globals.css`**, no como archivo nuevo — mismo criterio que spec 01 (una sola hoja de estilos global), evitando duplicar variables y animaciones ya existentes.
- **Se usa `Link` de `next/navigation`/`next/link` en vez del prop `navigate` del template** — mismo criterio que el resto de pantallas ya migradas (spec 01), por rutas reales de Next.js en vez de routing por hash/prop.
</content>
