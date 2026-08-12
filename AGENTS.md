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
- Dos cancel-subscription endpoints (duplicados)

### Pendiente (no solicitado aún)
- Unificar los 2 cancel-subscription en uno solo
- Manejar invoice.paid para renovaciones automáticas
- Idempotencia en webhooks

## Cambios realizados (Agosto 2026) — Sesión jandosoft + hormiruta

### Jandosoft — Mapa del admin portado de hormiruta (tu API key)
- El mapa del admin de hormiruta (`NavMap.tsx`, mapId `4504f9d373b138cf`) se portó tal cual a jandosoft en `components/maps/AdminFleetMap.tsx` usando `@vis.gl/react-google-maps@^1.9.0` (instalado). Mismo mapId, `colorScheme` DARK/LIGHT, `renderingType VECTOR`, `gestureHandling greedy`, mismo `TrafficLayer` y pins 🏪/📍 con ping/pulse. `Admin.tsx` (pestaña "Mapa") ahora apunta a `AdminFleetMap`; `components/maps/AdminMap.tsx` (versión vanilla) fue borrado.
- La key de Google Maps **es del usuario** y se usa con patrón hormiruta: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- **Respaldo global de key en jandosoft**: `lib/maps/loader.ts` ahora usa `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` cuando la tienda no tiene su propia key; `lib/maps/api-key-check.ts` reporta configurado si existe la key global. Aplica a página pública de tienda, CRM, panel del negocio y admin.
- La key de hormiruta (`AIzaSyBpAq8ZhkCEzMUDawqGnC9vcg_KsL76pPU`) se copió a `/Users/jandoserrano/Desktop/jandosoft/.env` (gitignore lo cubre, no se commitea).
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

### Estado de builds
- Hormiruta: `tsc` limpio y `rm -rf .next && NODE_OPTIONS="--max-old-space-size=2048" npm run build` OK (a veces falla transitorio `/_not-found` ENOENT; reintentar).
- Jandosoft: `tsc` limpio y build OK.

### Pendiente
- Commit/push del lote acumulado (hormiruta y jandosoft) — decisión del usuario.
- Jandosoft: verificar mapa admin renderiza con la key global (reinicar dev server).
- Hormiruta: endurecer seed admin/password en producción (admin@hormiruta.com/admin123).
