# Hormiruta — Contexto para el agente

## REGLAS OBLIGATORIAS (NO VULNERAR)

1. **El login de Google en Android es SIEMPRE NATIVO, NUNCA flujo web.**
   - Usa `@capacitor-firebase/authentication` → `FirebaseAuthentication.signInWithGoogle()` (hoja nativa de Google del teléfono).
   - **PROHIBIDO** el flujo web dentro de la WebView: `signIn('google', { redirect: true })` en `Capacitor.isNativePlatform()`. El usuario lo prohibió explícitamente y NO se debe volver a implementar.
   - Tras el activity nativo de Google: navegar con `router.replace()` / `update()` (navegación SPA). **NUNCA** `redirect: true` / recarga completa del bundle, porque en Capacitor con servidor remoto eso cerraba la app en gama media (Redmi/Samsung).
   - El flujo web (`signIn('google')`) es SOLO para navegador web (no Capacitor).
   - Requisito en el APK: plugin `capacitor-firebase-authentication` + `google-services.json` ya están integrados.

## Cambios realizados (Agosto 2026, sesión 14-08)

- **Login nativo restaurado** (commit `333c96b`): `app/auth/login/page.tsx` y `app/auth/register/page.tsx` vuelven a `FirebaseAuthentication.signInWithGoogle()` + `getCurrentUser()` + `getIdToken()` + `signIn('credentials',{googleIdToken})` + `update()` + `router.replace('/dashboard')`, con watchdog de 25s. `app/lib/auth.ts` ya verifica `googleIdToken` con Firebase Admin.
- **@capacitor/cli actualizado a v8** (commit `43d0a2c`): antes 6.2.1 con runtime v8 (desalineado).
- **APK y AAB reconstruidos desde cero** (14-08): `android/app/build/outputs/apk/release/app-release.apk` (8.1 MB) y `app-release.aab` (7.2 MB), firmados v1/v2/v3, zipalign OK, universales (sin libs nativas). Copias en `~/Desktop/`.
- **Para rebuilds Android**: `JAVA_HOME=/opt/homebrew/opt/openjdk@21 ./gradlew clean assembleRelease bundleRelease` dentro de `android/` (el JDK de Homebrew no está en el PATH).
- Seguridad pendiente: `release-key.jks` y sus contraseñas NO deben estar commiteados (hoy sí lo están). Si se pierde el keystore, no se puede actualizar la app.

## Cambios realizados (Julio 2026)

### Moneda MXN
- Pricing model cambiado de USD a MXN
- Stripe Price IDs deben estar en MXN (dashboard.stripe.com)
- Comentario agregado en `app/api/payments/stripe/checkout/route.ts`

### Toast reemplazó alert()
- Instalado `react-hot-toast`, Toaster en layout.tsx
- 20 alert() + 1 confirm() eliminados en: pricing/page.tsx, PricingModal.tsx, login, register, admin-login, StopInput.tsx, SavedRoutes.tsx

### Atribución
- Alejandro Serrano eliminado
- Jandosoft se mantiene como marca visible

### Términos y Privacidad
- Limitación de responsabilidad agregada (servicio "tal cual", no responsables por multas/accidentes/retrasos)
- Stripe como procesador externo, no responsables por fallos de pago

### Stripe
- Solo suscripciones + pagos únicos flex (sin affilados, sin Stripe Connect)
- Checkout Sessions + PaymentIntents
- Webhook `app/api/webhooks/stripe/route.ts` con eventos habilitados en el endpoint (14/08/2026 se corrigió: antes solo estaba `payment_intent.succeeded`, por eso los planes pagados no se activaban):
  - `checkout.session.completed` (activación principal, lee `session.metadata`)
  - `customer.subscription.created/updated/deleted`
  - `invoice.paid`, `invoice.payment_failed`
  - `payment_intent.succeeded` (respaldo para planes flex; necesita `payment_intent_data.metadata` que se inyecta en checkout route)
- Un solo cancel-subscription endpoint (`app/api/payments/stripe/cancel-subscription`); los duplicados de antes ya se unificaron
- El checkout embebido ahora llama a `verify-checkout` al completar (sesión extraída de `client_secret` con `split('_secret_')`), así el plan se activa aunque el webhook tarde

### Pendiente (no solicitado aún)
- Idempotencia en webhooks (ya hay `WebhookEvent` + dedupe; revisar cobertura)
- En su momento: `invoice.paid` para renovaciones (hoy ya se marca `expired` en fallo/vencimiento)

## Cambios realizados (Agosto 2026) — Sesión jandosoft + hormiruta

### Jandosoft — Mapa del admin portado de hormiruta (tu API key)
- El mapa del admin de hormiruta (`NavMap.tsx`, mapId `4504f9d373b138cf`) se portó tal cual a jandosoft en `components/maps/AdminFleetMap.tsx` usando `@vis.gl/react-google-maps@^1.9.0` (instalado). Mismo mapId, `colorScheme` DARK/LIGHT, `renderingType VECTOR`, `gestureHandling greedy`, mismo `TrafficLayer` y pins 🏪/📍 con ping/pulse. `Admin.tsx` (pestaña "Mapa") ahora apunta a `AdminFleetMap`; `components/maps/AdminMap.tsx` (versión vanilla) fue borrado.
- La key de Google Maps **es del usuario** y se usa con patrón hormiruta: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- **Respaldo global de key en jandosoft**: `lib/maps/loader.ts` ahora usa `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` cuando la tienda no tiene su propia key; `lib/maps/api-key-check.ts` reporta configurado si existe la key global. Aplica a página pública de tienda, CRM, panel del negocio y admin.
- La key de hormiruta se copió a `/Users/jandoserrano/Desktop/jandosoft/.env` (gitignore lo cubre, no se commitea). La key real se mantiene SOLO en `.env` locales, nunca en AGENTS.md ni en git.
- **IMPORTANTE**: como la key corre en ambos proyectos, activar Budget de Google Cloud pronto (el medidor de hormiruta ya alerta ≥80%).

### Jandosoft — Carga masiva limitada a 15 en free
- `lib/models/Store.ts`: campo `bulkImportsUsed`.
- `app/api/customers/import/route.ts`: usuarios free (sin plan o free, incluye expirados/cancelados) topen a **15 cargas**; 403 con mensaje al agotarse; contador sube solo si creó ≥1 cliente. Pagados sin límite.
- `components/crm/CustomersPanel.tsx`: CSV y leads muestran el mensaje de error del límite.

### Hormiruta — Carga masiva 15 usos gratis (era pago-forzado)
- Antes: `DashboardModals.tsx` mandaba a `PricingModal` a todo no-Pro al abrir Carga Masiva (por eso "me sale para pagos"). Ahora: 15 usos gratis.
- `app/models/User.ts`: campo `bulkImportsUsed`.
- `app/api/user/bulk-import/route.ts` (nuevo): `GET` devuelve `{unlimited|used, remaining, limit}`; `POST` consume 1 atómicamente (`$inc` con `$lt`) → 403 al agotarse. Pro (premium/fleet activo/trialing o `adminGranted`) = ilimitado.
- `DashboardModals.tsx`: al abrir bulk-import verifica disponibilidad (Pro → directo; free con intentos → BulkImport; free agotado → PricingModal). Contador se consume al importar con éxito.
- `app/components/BulkImport.tsx`: prop opcional `freeRemaining` → banner "Plan gratuito: te quedan X cargas masivas para probar". Modal en móvil: overlay `items-start` + `overflow-y-auto` + `my-auto` para que no se esconda arriba.
- `DashboardModals.tsx` contenedor subido a `z-[210]` (antes `z-[100]`): el header móvil (`z-[120]`) y el drawer (`z-[200]`) tapaban los modales.

### Hormiruta — UX de mapa y navegación
- `DashboardControls.tsx`: botón "Circuito" móvil bajado de `top-24` a `top-[196px]` (+100px en Y).
- Nuevo botón "Invertir Ruta" debajo de Circuito (mismo estilo `bg-black/60 text-white/50`), usa `handleReverseRoute` existente; se pasó el prop desde `app/dashboard/page.tsx`.
- Barra de navegación móvil: "Periferia" → **"Ajustes"** (`DashboardControls.tsx:186`).
- `NavigationMenu.tsx`: botón "Itinerario" ahora cierra el Centro de Mando (`setIsMobileMenuOpen(false)`) y cambia map/list — antes no cerraba el drawer y parecía que no pasaba nada.

### Hormiruta — Cobros de planes ahora como jandosoft (price_data MXN)
- `app/api/payments/stripe/checkout/route.ts` reescrito: cobra el `price` del plan directo en MXN con `price_data` (sin necesitar `STRIPE_{PLAN}_PRICE_ID` ni `stripePriceId`). `durationDays > 0` → pago único (`mode: payment`); `0`/ausente → suscripción mensual (`recurring month`). Mínimo $10 MXN. Sigue soportando checkout embebido (`clientSecret`) y hosted (`url`). Prueba 7 días gratis de Premium se mantiene (`trial_period_days`).
- `app/models/Pricing.ts` y `app/lib/defaultPlans.ts`: campo `durationDays` (flex = pago único con expiración now + durationDays). `stripePriceId` ya no se usa para cobrar (quedó opcional).
- `app/api/webhooks/stripe/route.ts`: en `checkout.session.completed` activa planes flex de pago único (`session.mode === 'payment'` + `metadata.durationDays`) seteando plan/expiración; usa `metadata.planId` (fallback al mapeo por nombre). Suscripciones siguen igual.
- `app/api/payments/stripe/verify-checkout/route.ts`: maneja pagos únicos (expiración por `durationDays`) y usa `planId`.
- `app/api/admin/pricing/route.ts`: crea/edita `durationDays` (planes flex configurables desde admin).
- `app/pricing/page.tsx` y `PricingModal.tsx`: envían `planId`; muestran duración flex ("X días") vs "al mes"; CTA sin depender de `stripePriceId`.
- Sync automático del estado de suscripción en la UI: nuevo `app/api/user/subscription/route.ts` (GET devuelve plan/status/expiry/adminGranted desde la BD) y polling cada 60s en `app/dashboard/page.tsx` que hace `update()` de la sesión si cambió y avisa una vez al pasar de Pro a free/vencido (p. ej. expiración de plan flex o renovación fallida). El checkout embebido de `PricingModal.tsx` también refresca la sesión al instante: usa `onComplete` en las options del `EmbeddedCheckoutProvider` (la API actual de Stripe no expone `onPaymentSuccess`) → fetch a `/api/user/subscription` + `update()` + toast + cierra el modal.
- `tsc` limpio y build OK.

### Hormiruta — Expiración automática de planes flex + límites centralizados
- Planes flex (pago único con `durationDays`) ahora vencen solos: `app/api/user/subscription/route.ts` compara `subscriptionExpiry < now` y baja a `{ plan: 'free', subscriptionStatus: 'expired' }` en BD (lazy, al primer poll del dashboard). Datos conservados; reactivar restaura el acceso.
- Gates de Pro centralizados en `app/lib/plan.ts`: `isPlanExpired`, `isProUser`, `isFleetActive` (todos consideran expiración). Refactorizados a usarlos: `app/api/routes/route.ts` (límite 10 paradas + 3 rutas guardadas), `app/api/optimize/route.ts` (>10 paradas) y `app/api/user/bulk-import/route.ts` (15/mes). Las rutas de flotilla ya usaban `isFleetActive`.
- Los cancel-subscription duplicados ya estaban unificados en uno solo; AGENTS.md actualizado.

### Hormiruta — Flotilla: trayectoria, geofence e invitaciones
- **Trayectoria**: `locationHistory` (array capado a 120 pts `{lat,lng,t}`) en `app/models/User.ts`, se llena en el POST de `app/api/user/location/route.ts` con `$push` + `$slice:-120`. `GET /api/fleet/members/[id]` devuelve `trajectory` (últimos 60). `FleetManager.tsx` renderiza mini-mapa SVG (`TrajectoryPolyline`, bounding box + haversine km) sin API key.
- **Geofence**: campo `geofence` en `Fleet.ts` (`enabled/lat/lng/radiusKm/centerLabel`). POST `/api/fleet` lo guarda; GET `/api/fleet` devuelve alertas por miembro (`alert: 'outside'|'no-signal'`) y `summary.outsideGeofence`. UI: toggle + inputs + "Mi ubicación" (geolocalización) + badges por fila y contador en resumen. "Sin señal" = sin update >10 min.
- **Invitación**: `inviteCode` + `inviteCodeExpires` (7 días) en Fleet. Nuevo `POST /api/fleet/invite` (dueño genera/regenera) y `POST /api/fleet/join` (chofer con cuenta se une por código; valida dueño/duplicado/vencido). UI dueño en FleetManager (copiar/regenerar); UI chofer `JoinFleetModal` (nuevo `join-fleet` en ActiveModal) abierto desde Sidebar/NavigationMenu con ítem "UNIRME A FLOTILLA" (ahora visible para todos; `fleetOnly` ya no se usa).
- **Gestión**: POST `/api/fleet/members` acepta nombre o correo (`query`; si el nombre da >1 match pide correo). Nuevo PATCH `/api/fleet/members/[id]` edita `vehicleType`. Quitar miembro ahora confirma en 2 pasos en la UI.

### Hormiruta — Planes 100% dinámicos (grantsPro/grantsFleet)
- Cada plan en `Pricing` ahora tiene `grantsPro` y `grantsFleet` (qué desbloquea). El admin los configura con 2 toggles nuevos en crear/editar plan. Backfill automático para planes históricos: `premium` → pro, `fleet` → pro+fleet.
- `app/lib/plan.ts` reescrito: `isProUser`/`isFleetActive` ahora son async y leen la config real del plan (caché 60s, `clearPlanCache()` al editar desde admin). Los gates de rutas/optimize/bulk-import/flotilla usan `await`.
- Webhook y verify-checkout guardan el **id real del plan** (`metadata.planId`) en `user.plan` (antes mapeaban todo a `premium`/`fleet`). Al pagar un plan custom, desbloquea exactamente lo que diga su config.
- Sesión (auth.ts): se inyectan `grantsPro`/`grantsFleet` al usuario para gating del cliente (login + poll de `/api/user/subscription` cada 60s). DashboardModals, dashboard y headers usan esos flags.
- Admin: badge de plan del chofer muestra el **nombre** del plan con color por grants; menú "Cambiar Plan" y select del detalle listan los planes reales.
- UI usuario: `SubscriptionManager` y `PricingModal` ahora cargan `/api/pricing` (nombres/precios/días dinámicos). Fallback a los viejos hardcode si falla el fetch.
- `admin/users/[id]`: cualquier plan != 'free' se activa automáticamente al asignarse desde admin.

### Hormiruta — Planes dinámicos: visibilidad en la app
- Un plan creado en el admin ahora se ve en toda la app de inmediato:
  - `/api/pricing` ganó `export const dynamic = 'force-dynamic'` (antes podía servir una snapshot del build) + `backfillGrants()` que rellena `grantsPro`/`grantsFleet` en planes históricos sin ellos (premium→pro, fleet→pro+fleet, custom→false/false).
  - `PricingModal.tsx`: se eliminó el filtro que ocultaba a usuarios premium los planes sin `grantsFleet`; ahora se muestran todos los planes activos.
  - Backfill manual en BD del plan legacy `light` → Solo Pro.

### Hormiruta — Pantalla offline personalizada
- **Web**: `app/components/OfflineScreen.tsx` (overlay en `app/layout.tsx`) rediseñado con logo de Hormiruta, "Sin Conexión a Internet", "Comprueba tu conexión e inténtalo nuevamente.", botón "Reintentar" (recarga) y auto-recubrimiento vía evento `online`. Responsive 340px; fallback a icono si el logo no carga.
- **Android/Capacitor**: `public/offline.html` rediseñado igual (logo embebido en base64 ~89KB para que sea 100% offline) con botón Reintentar + listener `online` que recarga. Se copia a `android/app/src/main/assets/public/offline.html` para que el `errorPath` de `capacitor.config.ts` funcione (antes el archivo NO estaba empaquetado y Android mostraba ERR_INTERNET_DISCONNECTED nativo).
- Nota: `android/app/src/main/assets/` está fuera de git (`.gitignore` de Android); tras editar `public/offline.html` hay que re-copiar el archivo a los assets del APK.

### Estado de builds
- Hormiruta: `tsc` limpio y `rm -rf .next && NODE_OPTIONS="--max-old-space-size=2048" npm run build` OK (a veces falla transitorio `/_not-found` ENOENT; reintentar).
- Jandosoft: `tsc` limpio y build OK.

### Pendiente
- Commit/push del lote acumulado (hormiruta y jandosoft) — decisión del usuario.
- Jandosoft: verificar mapa admin renderiza con la key global (reinicar dev server).
- Hormiruta: endurecer seed admin/password en producción (admin@hormiruta.com/admin123).
