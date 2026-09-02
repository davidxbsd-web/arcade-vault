# 03 — Acerca de + Contacto

- **Estado:** Implementado
- **Depende de:** SPEC 01, SPEC 02
- **Fecha:** 2026-09-01
- **Objetivo:** Crear la ruta `/acerca-de` portando `references/templates/home-about/about.jsx` tal cual, con su formulario de contacto conectado a un envío de correo real vía Resend mediante una Server Action.

## Alcance

**Incluye:**

- Nueva ruta `app/acerca-de/page.tsx` que renderiza el contenido de `references/templates/home-about/about.jsx` con las mismas secciones y en el mismo orden:
  - **About hero** — `kicker` "▸ ACERCA DE", `about-title` "ACERCA DE ARCADE VAULT", `about-mission`, y `highlight-row` con 3 `highlight` (`HEART` / `BROWSER` / `PLANT`) usando `HighlightIcon`, portado tal cual (mismos textos y colores).
  - **`about-divider`** — banner decorativo con `div-bar` y 24 `div-pixels`, portado tal cual, con clase `reveal`.
  - **About contact** (`section.about-contact.reveal`) — `contact-grid` con:
    - `contact-intro`: `kicker` "▸ CONTACTO", `contact-title` "CONTÁCTANOS", `contact-sub` y `contact-tips` (3 tips), portados tal cual.
    - `contact-form`: campos `NOMBRE`, `CORREO ELECTRÓNICO` (`type="email"`), `MENSAJE` (`textarea`), y botón "▶  ENVIAR MENSAJE".
- Hook `useReveal` (IntersectionObserver que agrega la clase `in` a los `.reveal`), idéntico al ya usado en `app/juegos/page.tsx`, portado como parte del client component de esta pantalla.
- Componentes `HighlightIcon` (3 variantes SVG: `HEART`, `BROWSER`, `PLANT`) portados de `about.jsx` a TypeScript.
- **Server Action** `app/acerca-de/actions.ts` (`"use server"`) que:
  - Recibe `(prevState, formData)` para usarse con `useActionState`.
  - Valida en servidor que `name`, `email` y `msg` no estén vacíos (tras `trim()`) y que `email` tenga formato de correo básico (regex simple).
  - Envía un correo con el SDK `resend`: `from` = `process.env.CONTACT_FROM`, `to` = `process.env.CONTACT_TO`, `replyTo` = email del formulario, `subject` = `"[Arcade Vault] Mensaje de <name>"`, cuerpo en texto plano con nombre, correo y mensaje.
  - Devuelve un objeto de estado discriminado: `{ status: "idle" }`, `{ status: "error", reason: "validation" | "send", message: string }`, o `{ status: "success", name: string }`.
- Estados de UI del formulario, gestionados con `useActionState` + `useFormStatus` (o el `pending` de `useActionState`):
  - **Inicial:** formulario visible.
  - **Validación fallida:** se mantiene el formulario y se dispara la animación `shake` (clase `contact-form.shake` durante ~400ms), igual que el template. Aplica tanto a la validación nativa HTML como al retorno `status: "error", reason: "validation"`.
  - **Enviando:** botón deshabilitado mientras `pending` es `true`.
  - **Éxito:** se reemplaza el formulario por `terminal-success` (portado tal cual del template) con el nombre en mayúsculas y el botón "ENVIAR OTRO MENSAJE" que resetea el estado.
  - **Error de envío:** variante de error de `terminal-success` — mismas `term-bar` y estructura, pero con líneas `[ERROR]` en color de alerta y un mensaje "> NO SE PUDO ENVIAR EL MENSAJE. INTENTA DE NUEVO." más botón "REINTENTAR" que vuelve al formulario con los datos aún escritos.
- Port aditivo a `app/globals.css` de las clases de `references/templates/home-about/styles.css` que faltan: `.about`, `.about-hero`, `.about-title`, `.about-mission`, `.highlight-row`, `.highlight`(+`.cyan`/`.magenta`/`.green`), `.hl-icon`, `.hl-text`, `.about-divider`, `.div-bar`, `.div-pixels`, `.about-contact`, `.contact-grid`, `.contact-intro`, `.contact-title`, `.contact-sub`, `.contact-tips`, `.tip`, `.tip-led`(+`.y`/`.m`), `.contact-form`(+`.shake`), `.contact-form textarea`, `@keyframes shake`, `.terminal-success`, `.term-bar`, `.term-body` y descendientes, `.caret`, más una regla nueva mínima para la variante de error de la terminal (p. ej. `.term-body .line.err`). No se duplican `.field`, `.reveal`/`.in`, `.kicker`, `.fade-in`, `blink`, variables de color (ya portados en specs 01/02).
- `components/Nav.tsx`: se re-agrega el enlace **"Acerca de"** → `/acerca-de` en desktop y en el panel móvil, activo cuando `pathname === "/acerca-de"`. Se extiende `isActive` para contemplar `"acerca-de"`.
- `.gitignore`: agregar excepción `!.env.example` para poder versionar la plantilla de variables.
- Nuevo archivo `.env.example` (versionado) con `RESEND_API_KEY=`, `CONTACT_FROM=onboarding@resend.dev`, `CONTACT_TO=` y un comentario de uso. El `.env.local` real (con la API key) no se versiona.
- Nueva dependencia `resend` en `package.json`.

**No incluye (fuera de alcance):**

- Persistencia de los mensajes enviados (base de datos, `localStorage`, archivo) — solo se envía el correo, no se guarda nada.
- Auto-respuesta / correo de confirmación al remitente — se envía un único correo al equipo (`CONTACT_TO`).
- Rate limiting, captcha o protección anti-spam más allá de la validación de campos obligatorios.
- Verificación de dominio en Resend / configuración DNS — se asume `onboarding@resend.dev` como `CONTACT_FROM` por defecto; cambiar a un dominio propio es configuración de entorno, no de código.
- Adjuntar archivos en el formulario de contacto.
- Cambios en `app/page.tsx` (el redirect a `/juegos` de la spec 02 se mantiene).
- Internacionalización, dark/light mode, responsive o accesibilidad más allá de lo que ya trae el CSS portado del template.
- Tests automatizados (no hay runner configurado en el repo).
- Modificar el resto del contenido de `home-about` — `home.jsx` ya fue portado en la spec 02 y `nav.jsx` del template no se usa como referencia.

## Modelo de datos

No se introduce ningún modelo de datos persistente ni estructura en `lib/data.ts`. El único "estado" es el objeto de retorno de la Server Action, consumido por `useActionState` en el cliente:

```ts
type ContactState =
  | { status: "idle" }
  | { status: "error"; reason: "validation" | "send"; message: string }
  | { status: "success"; name: string };
```

Variables de entorno (en `.env.local`, no versionado; plantilla en `.env.example`):

```txt
RESEND_API_KEY=re_xxxxxxxx      # API key de Resend (secreta, solo servidor)
CONTACT_FROM=onboarding@resend.dev  # remitente; dominio verificado o el sandbox de Resend
CONTACT_TO=equipo@ejemplo.com   # destinatario de los mensajes de contacto
```

Ninguna variable lleva prefijo `NEXT_PUBLIC_`: las tres se usan únicamente dentro de la Server Action, en el servidor.

## Plan de implementación

1. **Dependencia y entorno.** Agregar `resend` a `package.json` (`npm install resend`). Agregar `!.env.example` a `.gitignore` y crear `.env.example` con las tres variables y comentarios. El proyecto sigue compilando (`npm run build`).
2. **Port de CSS.** Agregar a `app/globals.css` las reglas de `about`/`contact`/`terminal` listadas en el alcance, más `.term-body .line.err` para el estado de error, sin duplicar clases ya presentes. Las pantallas existentes no cambian visualmente.
3. **Server Action.** Crear `app/acerca-de/actions.ts` con `"use server"` y `sendContactMessage(prevState: ContactState, formData: FormData): Promise<ContactState>`: valida campos, instancia `new Resend(process.env.RESEND_API_KEY)`, envía el correo con `replyTo` al email del formulario, y mapea el resultado a `ContactState`. Si falta alguna env var o Resend responde error, devuelve `{ status: "error", reason: "send", ... }`.
4. **Página `/acerca-de`.** Crear `app/acerca-de/page.tsx` (`"use client"`) portando el markup de `about.jsx`: `useReveal`, `HighlightIcon`, about hero, divider, y `contact-form` cableado con `useActionState(sendContactMessage, { status: "idle" })`. Los `<input>`/`<textarea>` usan `name` (`name`, `email`, `msg`), `required` y `type="email"` para validación nativa. Renderiza condicionalmente formulario / `terminal-success` / variante de error según `state.status`. Dispara `shake` en `reason: "validation"` y en submit nativo inválido.
5. **Actualizar Nav.** En `components/Nav.tsx` agregar el enlace "Acerca de" → `/acerca-de` (desktop y móvil) y extender `isActive` para `"acerca-de"` (`pathname === "/acerca-de"`).
6. **Verificación.** Con un `RESEND_API_KEY` de prueba en `.env.local`, correr `npm run dev`, recorrer `/acerca-de`, enviar el formulario vacío (shake), enviarlo completo (terminal-success + correo recibido en `CONTACT_TO`), forzar un error (API key inválida → variante de error + reintentar). Confirmar que no hay errores de consola y que `npm run build` pasa.

## Criterios de aceptación

- [ ] `http://localhost:3000/acerca-de` responde 200 y renderiza el about hero (título "ACERCA DE ARCADE VAULT", mission, 3 `highlight`), el `about-divider` y la sección de contacto, con el mismo contenido de texto que `references/templates/home-about/about.jsx`.
- [ ] Las secciones con clase `reveal` reciben la clase `in` al hacer scroll hasta ellas.
- [ ] Enviar el formulario con cualquier campo vacío no envía correo y dispara la animación `shake` en `contact-form`.
- [ ] Enviar el formulario con nombre, correo válido y mensaje muestra el bloque `terminal-success` con el nombre en mayúsculas, y llega un correo a `CONTACT_TO` cuyo `reply-to` es el correo escrito en el formulario.
- [ ] Mientras el envío está en curso, el botón de envío queda deshabilitado.
- [ ] El botón "ENVIAR OTRO MENSAJE" del estado de éxito vuelve a mostrar el formulario vacío.
- [ ] Con `RESEND_API_KEY` inválido o `CONTACT_TO` sin definir, el envío muestra la variante de error de la terminal (líneas `[ERROR]`) con botón "REINTENTAR" que devuelve al formulario conservando lo escrito, y no rompe la página.
- [ ] `RESEND_API_KEY`, `CONTACT_FROM` y `CONTACT_TO` no aparecen en el bundle del cliente (no tienen prefijo `NEXT_PUBLIC_`).
- [ ] El Nav muestra el enlace "Acerca de" (desktop y menú móvil), activo solo en `/acerca-de`, y los demás enlaces conservan su estado activo previo.
- [ ] `.env.example` está versionado; `.env.local` no.
- [ ] `npm run build` completa sin errores de TypeScript ni de ESLint y no hay errores en la consola del navegador al navegar por `/acerca-de`.

## Decisiones tomadas y descartadas

- **Ruta `/acerca-de`** (no `/about`). Coherente con las rutas en español ya existentes (`/biblioteca`, `/salon`, `/juegos`).
- **Server Action + `useActionState`** para el envío, en vez de un Route Handler con `fetch` desde el cliente. Motivo: es el patrón idiomático de Next.js 16 para formularios, mantiene la API key solo en servidor sin plumbing manual, y encaja con el reemplazo in-place del formulario por la terminal del template. Se descarta el Route Handler por ser más verboso sin beneficio aquí.
- **SDK `resend`** en vez de `fetch` directo a `https://api.resend.com/emails`. Una dependencia pequeña y oficial que da tipos y manejo de errores; el ahorro de "cero deps" no compensa.
- **Variante de error en la terminal** en vez de un mensaje de error simple. Mantiene la coherencia estética pixel/terminal del template y da feedback claro cuando Resend falla (caso real: API key mal configurada en un entorno nuevo).
- **Validación en servidor manual (checks + regex simple)**, sin agregar `zod`. Son 3 campos; una dependencia de validación es excesiva para este caso. La validación nativa HTML (`required`, `type="email"`) cubre el camino feliz en el cliente.
- **Un solo correo al equipo, sin auto-respuesta al remitente.** El template no la contempla y añade complejidad (segundo envío, plantilla) sin pedirla. Se pone `replyTo` al correo del formulario para poder responder directo.
- **`CONTACT_FROM` por defecto `onboarding@resend.dev`** (sandbox de Resend), para que funcione sin verificar dominio. Cambiar a un dominio propio es solo editar la env var.
- **Sin persistencia de mensajes ni anti-spam.** No hay backend ni base de datos en el proyecto; agregar almacenamiento o rate limiting es una spec aparte si alguna vez se necesita.
- **`about.jsx` se porta ahora como spec propia**, tal como anticipó la spec 02 al excluir explícitamente la sección About de la landing.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| `RESEND_API_KEY` ausente o inválido en un entorno nuevo | La Server Action detecta el fallo y devuelve `status: "error"`; la UI muestra la variante de error sin romper. `.env.example` documenta las tres variables. |
| `CONTACT_FROM` con dominio no verificado → Resend rechaza el envío | Valor por defecto `onboarding@resend.dev` (sandbox), que funciona sin verificación. Documentado en `.env.example`. |
| Envío del formulario sin JS (progressive enhancement) salta la animación `shake` | Aceptable: la validación en servidor igualmente bloquea el envío y `type="email"`/`required` aplican en el navegador; la degradación es solo cosmética. |
| Spam al endpoint del formulario | Fuera de alcance en esta spec; anotado como trabajo futuro (captcha / rate limiting). |

## Lo que **no** entra en esta spec

- Persistencia o historial de mensajes de contacto.
- Auto-respuesta / correo de confirmación al remitente.
- Rate limiting, captcha o anti-spam.
- Verificación de dominio en Resend y configuración DNS.
- Adjuntos en el formulario.
- Tests automatizados.

Cada uno de ellos, si llega, va en su propia spec.
