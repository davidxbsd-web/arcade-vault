# 05 — Juego Asteroids (jugable)

- **Estado:** Implementado
- **Depende de:** SPEC 01, SPEC 02
- **Fecha:** 2026-09-09
- **Objetivo:** Portar el juego de canvas `references/started-games/02-asteroids/game.js` a TypeScript como un componente React montado condicionalmente en el Reproductor, y darlo de alta como un juego nuevo (`asteroids`) del catálogo, jugable de verdad en `/jugar/asteroids`.

## Por qué existe esta spec

Hasta ahora todos los "juegos" de Arcade Vault son fichas mock: el Reproductor (`/jugar/[id]`) muestra una simulación decorativa donde el marcador sube solo con un `setInterval`. Esta spec convierte **un** juego —Asteroids, uno nuevo, distinto de la ficha existente `rocas`— en un juego real sobre `<canvas>`, cableado al HUD, la pausa y el modal de guardado que ya tiene el Reproductor. Es el primer juego jugable de la plataforma y fija el patrón para los siguientes.

Asteroids y `rocas` son juegos **distintos**: `rocas` sigue siendo una ficha mock sin cambios, y su carpeta de referencia no se toca. La referencia de Asteroids vive en `references/started-games/02-asteroids/` y se mantiene tal cual.

## Alcance

**Incluye:**

- **Nueva entrada en `GAMES` (`lib/data.ts`):** un 9º juego
  - `id: "asteroids"`, `title: "ASTEROIDS"`, `cat: "SHOOTER"`.
  - `cover: "cover-rocas"` — reutiliza la clase de portada existente; **no** se crea CSS de cover nuevo.
  - `color`, `best`, `plays`, `short`, `long`: valores placeholder coherentes con el resto del array (texto pixel/arcade en español, `best`/`plays` numéricos plausibles). No hay backend: son decorativos como en los demás.
  - Consecuencia aceptada: al mapear `GAMES`, el juego aparece automáticamente en `/biblioteca`, en las tabs de `/salon` y (por posición 9ª, fuera de los primeros 6) **no** en el rail de `/juegos`. **No se modifica** el código de `/biblioteca`, `/salon` ni `/juegos`.
  - `/juegos/asteroids` (detalle) funciona sin cambios de código: usa la plantilla genérica de `app/juegos/[id]/page.tsx`.

- **Port del juego a TypeScript en `components/games/asteroids/`:**
  - `constants.ts` — `W`, `H`, `RADII`, `SPEEDS`, `POINTS`, `POWERUP_DROP_CHANCE`, `POWERUP_DURATION`, `POWERUP_TTL`, `TRIPLE_SPREAD`, y los helpers `wrap`, `dist`, `rand`, `randInt`.
  - `entities.ts` — clases `Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle` portadas de `game.js`, tipadas. `update(dt: number)` sin cambios; `draw(ctx: CanvasRenderingContext2D)` recibe el contexto como parámetro (en el original es un global de módulo). Se **mantiene el power-up 3x** (clase `PowerUp` + disparo triple temporal de `Ship`) tal como está en `game.js`.
  - `game.ts` — clase `AsteroidsGame` que encapsula todo el estado global del `game.js` (`ship`, `bullets`, `asteroids`, `particles`, `powerUps`, `score`, `lives`, `level`, `state`, `deadTimer`, `powerUpSpawned`, `killsSinceSpawn`) y la lógica de `spawnAsteroids`, `initGame`, `nextLevel`, `explode`, `killShip`, `update`, `draw`, `drawHUD` (ver abajo), `drawOverlay`. Expone:
    - `constructor(ctx: CanvasRenderingContext2D)`.
    - `start()` / `stop()` — registran/quitan los listeners `keydown`/`keyup` en `window` y arrancan/paran el bucle `requestAnimationFrame`. `stop()` es idempotente.
    - `paused: boolean` — mientras es `true`, el bucle sigue vivo pero se salta `update(dt)`; al volver a `false` se resetea el timestamp interno para no arrastrar un `dt` gigante.
    - `restart()` — reinicia la partida (equivalente a `initGame`).
    - Callbacks opcionales: `onScoreChange(score)`, `onLivesChange(lives)`, `onLevelChange(level)`, `onGameOver(score)`. Se disparan solo cuando el valor cambia.
  - `Asteroids.tsx` — client component (`"use client"`). Props: `{ paused: boolean; onScore; onLives; onLevel; onGameOver }`. Renderiza `<canvas width={800} height={600}>`; en un `useEffect` crea `AsteroidsGame`, conecta los callbacks a las props, llama `start()`, y en el cleanup llama `stop()`. Un cambio de la prop `paused` se propaga a `game.paused`. El reinicio se hace desde el padre remontando el componente vía `key` (no hay API imperativa).
  - Input: teclas `ArrowLeft`/`ArrowRight`/`ArrowUp`/`Space`, con `preventDefault()` en esas teclas para no hacer scroll de la página. Se conserva el patrón `keys` / `justPressed` / `pressed()` del original. Controles táctiles **fuera de alcance**.

- **`components/Reproductor.tsx` — integración condicional:**
  - Si `game.id === "asteroids"`:
    - En lugar de `<div className="game-arena">…</div>` (naves/enemigos falsos) se monta `<Asteroids paused={paused} onScore={setScore} onLives={setLives} onLevel={setLevel} onGameOver={…} />` dentro de `.crt-screen`.
    - Se **desactiva** el `setInterval` que sube `score`/`level` solos (el `useEffect` de simulación no corre para este `id`).
    - `lives` deja de ser una constante fija de 3 y pasa a ser estado (`useState`) alimentado por `onLives`.
    - `onGameOver(score)` fija la puntuación final y abre el modal "FIN DEL JUEGO" existente. El botón **PAUSA/REANUDAR** controla `paused` (ya existe). El botón **FIN** sigue forzando el fin manualmente.
    - "JUGAR DE NUEVO" del modal reinicia la partida real (cambiando el `key` del `<Asteroids>`) además de resetear el estado de UI.
    - El overlay interno "GAME OVER — ESPACIO PARA REINICIAR" del canvas y su auto-reinicio con Espacio se **suprimen**: manda el modal del Reproductor. El overlay "EN PAUSA" del Reproductor se mantiene.
  - Para cualquier otro `game.id`, el Reproductor se comporta **exactamente igual que hoy** (simulación con `setInterval`, `lives` = 3).
  - El nombre de jugador ("INVITADO"), el input de iniciales y el guardado en `localStorage` (`av_scores`) del modal no cambian.

- **`app/globals.css` — port aditivo mínimo:** una regla para que el `<canvas>` encaje en `.crt-screen` (p. ej. `.crt-screen canvas { display:block; width:100%; height:100%; object-fit:contain; background:#000; }`). No se duplica ni modifica ninguna clase existente.

**No incluye (fuera de alcance, para specs futuras):**

- Convertir cualquier otro juego (`rocas`, `caida`, `serpentina`, …) en jugable. Siguen siendo mock.
- Un "motor de juegos" genérico / registro `id → componente` en el Reproductor. Aquí es un `if` por `id`; la abstracción llega cuando haya un segundo juego portado.
- Controles táctiles / on-screen para móvil.
- Redimensionado real del canvas al contenedor (se escala por CSS con tamaño interno fijo 800×600).
- Sonido (el `game.js` de referencia no tiene).
- Persistir la puntuación de Asteroids en Supabase o leerla de vuelta en `/salon` o `/juegos/[id]` — se guarda en `localStorage` (`av_scores`) igual que la simulación actual, sin lectura posterior.
- Tocar `references/started-games/02-asteroids/` o la carpeta de `rocas`.
- Cambios en `/biblioteca`, `/salon`, `/juegos` (landing) o `app/juegos/[id]/page.tsx`.
- Arte de portada propio para Asteroids (`cover-asteroids`): se reutiliza `cover-rocas`.
- Tests automatizados (no hay runner en el repo).
- Cambios de dificultad, balance o niveles respecto al `game.js` original: se porta tal cual.

## Modelo de datos

No se introduce persistencia nueva. La única estructura nueva es la entrada de `GAMES` y las interfaces del componente de juego:

```ts
// lib/data.ts — nueva entrada en GAMES (valores de texto/números placeholder)
{
  id: "asteroids",
  title: "ASTEROIDS",
  short: "…",              // 1 frase, estilo arcade
  long: "…",               // 2–3 frases
  cat: "SHOOTER",
  cover: "cover-rocas",    // reutilizado
  color: "yellow",         // a elegir entre los ya usados
  best: 41200,             // placeholder
  plays: "15.6K",          // placeholder
}
```

```ts
// components/games/asteroids/Asteroids.tsx
type AsteroidsProps = {
  paused: boolean;
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (finalScore: number) => void;
};
```

El estado interno del juego (`AsteroidsGame`) es el mismo conjunto de variables que los globales de `game.js`; no se serializa ni se guarda entre sesiones. `state` sigue siendo `'playing' | 'dead' | 'gameover'`.

Escritura en `localStorage`: solo la clave `av_scores`, y solo desde el botón "GUARDAR PUNTUACIÓN" del modal del Reproductor (sin cambios respecto a SPEC 01).

## Plan de implementación

1. **Alta del juego en el catálogo.** Añadir la entrada `asteroids` a `GAMES` en `lib/data.ts` con `cover: "cover-rocas"` y valores placeholder. Verificar que `/juegos/asteroids` (detalle) y `/jugar/asteroids` (reproductor, aún con la simulación mock) responden 200 y que aparece en `/biblioteca` y `/salon`. `npm run build` pasa.
2. **Port de constantes y entidades.** Crear `components/games/asteroids/constants.ts` y `entities.ts` portando helpers y clases `Bullet`/`Asteroid`/`PowerUp`/`Ship`/`Particle` de `game.js` a TypeScript, con `draw(ctx)` parametrizado. Sin uso todavía; `npm run build` y `npx eslint` pasan.
3. **Clase `AsteroidsGame`.** Crear `components/games/asteroids/game.ts` con toda la lógica de estado, `update`/`draw`/`drawHUD`/`drawOverlay`, `start`/`stop` (listeners + rAF), `paused`, `restart` y los 4 callbacks `onScoreChange`/`onLivesChange`/`onLevelChange`/`onGameOver`. Quitar el auto-reinicio con Espacio en `state === 'gameover'` y el overlay GAME OVER (o dejar de dibujarlo); al llegar a `lives <= 0` disparar `onGameOver` y `stop()`.
4. **Componente `Asteroids.tsx`.** Crear el wrapper client: `<canvas>` 800×600, `useEffect` que instancia `AsteroidsGame`, engancha callbacks, `start()`, y limpia con `stop()`; efecto que sincroniza `props.paused → game.paused`.
5. **Regla CSS del canvas.** Añadir a `app/globals.css` la regla aditiva para `.crt-screen canvas`. Las pantallas existentes no cambian visualmente.
6. **Integración en el Reproductor.** En `components/Reproductor.tsx`: convertir `lives` en `useState`; condicionar el `useEffect` de simulación a `game.id !== "asteroids"`; renderizar `<Asteroids>` (con `key` de reinicio) en vez de `.game-arena` cuando `game.id === "asteroids"`; cablear `onScore`/`onLives`/`onLevel` al estado del HUD y `onGameOver` a abrir el modal; hacer que "JUGAR DE NUEVO" incremente el `key`. El resto de juegos queda intacto.
7. **Verificación.** `npm run dev`, ir a `/jugar/asteroids`: jugar con flechas + Espacio, comprobar que el HUD (puntuación, vidas, nivel) refleja el juego real, que romper asteroides suma puntos y los parte, que aparece el power-up 3x, que PAUSA congela y REANUDAR sigue sin salto, que perder 3 vidas abre el modal "FIN DEL JUEGO", que "GUARDAR PUNTUACIÓN" escribe en `av_scores`, y que "JUGAR DE NUEVO" reinicia. Abrir `/jugar/rocas` y confirmar que sigue con la simulación mock. Sin errores de consola. `npm run build` y `npx eslint` pasan.

## Criterios de aceptación

- [x] `GAMES` en `lib/data.ts` tiene 9 entradas; la nueva es `id: "asteroids"`, `title: "ASTEROIDS"`, `cover: "cover-rocas"`.
- [x] `/juegos/asteroids` responde 200 y muestra el detalle con la portada de `cover-rocas`; `/biblioteca` y `/salon` incluyen "ASTEROIDS" sin cambios de código en esas páginas.
- [x] `/jugar/asteroids` renderiza un `<canvas>` jugable dentro de la pantalla CRT (no la `game-arena` decorativa).
- [x] Con el foco en la página, `←`/`→` rotan la nave, `↑` propulsa y `Espacio` dispara, y esas teclas no hacen scroll de la página.
- [x] Disparar a un asteroide grande lo parte en medianos, y los medianos en pequeños; la puntuación sube según `POINTS` y se refleja en el HUD del Reproductor.
- [x] Existe el power-up 3x: al recogerlo, el disparo pasa a triple durante unos segundos.
- [x] El HUD del Reproductor muestra puntuación, vidas y nivel provenientes del juego real (no del `setInterval`); las vidas empiezan en 3 y bajan al chocar.
- [x] "PAUSA" congela el juego (con overlay "EN PAUSA") y "REANUDAR" lo continúa sin un salto brusco de simulación.
- [x] Al perder la 3ª vida se abre el modal "FIN DEL JUEGO" con la puntuación final; el canvas no muestra su propio overlay "GAME OVER" ni se reinicia solo con Espacio.
- [x] "GUARDAR PUNTUACIÓN" añade una entrada a `localStorage.av_scores` con `{ game: "asteroids", score, name, at }`; "JUGAR DE NUEVO" reinicia una partida nueva desde 0.
- [x] `/jugar/rocas` (y cualquier otro `id`) sigue mostrando la simulación mock con marcador automático, sin regresiones.
- [x] Al salir de `/jugar/asteroids` (navegar fuera) se cancela el `requestAnimationFrame` y se quitan los listeners de teclado (sin fugas ni errores en consola).
- [x] `npm run build` completa sin errores de TypeScript ni de ESLint y no hay errores en la consola del navegador.

## Decisiones tomadas y descartadas

- **Asteroids es un juego nuevo (`id: "asteroids"`), no la ficha `rocas`.** Decisión explícita del usuario: son juegos distintos y sus referencias se mantienen separadas. `rocas` no se toca.
- **`cover: "cover-rocas"` reutilizado**, sin crear `cover-asteroids`. Ahorra CSS nuevo; el coste (dos fichas con la misma portada) es asumible y reversible en otra spec.
- **Integración condicional (`if game.id === "asteroids"`) en `Reproductor.tsx`**, no un motor de juegos genérico con registro `id → componente`. Con un solo juego portado, la abstracción sería especulativa (YAGNI); se hará cuando llegue el segundo.
- **Port a TypeScript modular** (`constants` / `entities` / `game` / wrapper), en vez de copiar `game.js` casi tal cual a un único `engine.ts`. Coherente con el resto del repo (TS tipado) y deja las entidades reutilizables.
- **Se mantiene el power-up 3x** del `game.js` de referencia (que ya lo trae), en vez de portar la versión básica del README. Es lo que hay en el código fuente real.
- **HUD alimentado por callbacks del juego** (`onScore`/`onLives`/`onLevel`), reusando el HUD del Reproductor, en vez de que el canvas dibuje su propio HUD. Mantiene una sola presentación de marcador/vidas/nivel y aprovecha el modal de guardado existente.
- **El Reproductor manda sobre pausa y fin de partida.** El `game.js` no tiene pausa y su GAME OVER es interno; se suprime ese overlay y su reinicio con Espacio para que el flujo (PAUSA, modal "FIN DEL JUEGO", "JUGAR DE NUEVO") sea el mismo que el de la simulación.
- **Canvas interno fijo 800×600 escalado por CSS**, no redimensionado real. El original asume 800×600 en toda su física y wrapping; recalcular `W`/`H` y posiciones es riesgo sin beneficio para esta spec.
- **Sin persistencia real de la puntuación** (solo `av_scores` en `localStorage`, sin lectura posterior). Igual que la simulación de SPEC 01; llevar puntuaciones reales a Supabase / `/salon` es otra spec.
- **Depende de SPEC 01 y SPEC 02:** SPEC 01 aporta el Reproductor, `lib/data.ts` y `globals.css`; SPEC 02 consume `GAMES` en la landing y fija que añadir un juego repercute en varias pantallas.
- **Controles táctiles descartados en esta spec.** El detalle del juego anuncia "TECLADO / TÁCTIL" pero el táctil real es trabajo aparte; de momento solo teclado.

## Riesgos identificados

| Riesgo                                                                                                    | Mitigación                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fugas de `requestAnimationFrame` / listeners de teclado al desmontar o remontar (`key`) el componente     | `AsteroidsGame.stop()` (idempotente) en el cleanup del `useEffect`; cancelar el rAF y quitar ambos listeners. Criterio de aceptación explícito.    |
| `dt` gigante al reanudar tras pausa o cambio de pestaña → "spiral of death" o teletransporte de entidades | El original ya capa `dt` a 50 ms; además se resetea el timestamp interno al pasar `paused` de `true` a `false`.                                    |
| `Space`/flechas hacen scroll de la página mientras se juega                                               | `preventDefault()` en esas teclas dentro del handler del juego.                                                                                    |
| En móvil (sin teclado) el juego no es jugable                                                             | Aceptado y anotado: controles táctiles son otra spec. El resto de la pantalla (HUD, salir) sigue funcionando.                                      |
| Añadir un 9º juego descuadra alguna pantalla que asume 6/8 juegos                                         | Revisado en el plan (paso 1): `/biblioteca` y `/salon` mapean `GAMES` sin número fijo; el rail de `/juegos` toma `slice(0,6)` y no se ve afectado. |
| `"use client"` y acceso a `window`/`document` en SSR                                                      | Todo el acceso al DOM ocurre dentro de `useEffect` (solo cliente); el `<canvas>` se renderiza vacío en SSR sin tocar `window`.                     |

## Lo que **no** entra en esta spec

- Hacer jugable cualquier otro juego del catálogo.
- Motor de juegos genérico / registro de juegos en el Reproductor.
- Controles táctiles y canvas responsive real.
- Puntuaciones reales de Asteroids en Supabase, `/salon` o `/juegos/[id]`.
- Sonido, cambios de balance/niveles, arte de portada propio.
- Tests automatizados.

Cada uno, si llega, va en su propia spec.
