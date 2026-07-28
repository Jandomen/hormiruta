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
