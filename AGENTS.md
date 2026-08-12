# Hormiruta — Contexto para el agente

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

### Stripe existente (sin modificar)
- Solo suscripciones (sin affilados, sin Stripe Connect)
- Checkout Sessions + PaymentIntents
- Webhook con 3 eventos: checkout.session.completed, subscription.updated, subscription.deleted
- Un solo cancel-subscription endpoint (`app/api/payments/stripe/cancel-subscription`); los duplicados de antes ya se unificaron

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
- Sync automático del estado de suscripción en la UI: nuevo `app/api/user/subscription/route.ts` (GET devuelve plan/status/expiry/adminGranted desde la BD) y polling cada 60s en `app/dashboard/page.tsx` que hace `update()` de la sesión si cambió y avisa una vez al pasar de Pro a free/vencido (p. ej. expiración de plan flex o renovación fallida).
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

### Estado de builds
- Hormiruta: `tsc` limpio y `rm -rf .next && NODE_OPTIONS="--max-old-space-size=2048" npm run build` OK (a veces falla transitorio `/_not-found` ENOENT; reintentar).
- Jandosoft: `tsc` limpio y build OK.

### Pendiente
- Commit/push del lote acumulado (hormiruta y jandosoft) — decisión del usuario.
- Jandosoft: verificar mapa admin renderiza con la key global (reinicar dev server).
- Hormiruta: endurecer seed admin/password en producción (admin@hormiruta.com/admin123).
