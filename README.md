# 🐜 Hormiruta

**Hormiruta** es una plataforma de gestión de rutas de entrega que ayuda a conductores y flotillas a planear, optimizar y ejecutar sus recorridos en tiempo real. Diseñada para funcionar igual en **web** y en **móvil** (app nativa Capacitor).

---

## ✨ Características principales

- 🗺️ **Mapa interactivo** con Google Maps: paradas numeradas, trazado de ruta (pasada/actual/futura) y pins de vehículo.
- 🔀 **Optimización de rutas** con tráfico real (Google Routes API) o motor interno (prioridad/horarios), antes y después de reordenar.
- 📍 **GPS en vivo**: seguimiento de posición del conductor, centrado automático y **geocercas** que detectan llegadas.
- 🚚 **Gestión de paradas**: alta manual o **carga masiva** (CSV/XLSX), reordenar con arrastre, duplicados, prioridades y ventanas de tiempo.
- 📦 **Tipo de vehículo**: Camión 🚛, Van 🚐, Auto 🚗, Pickup 🛻, Moto 🏍️ y más.
- 🚨 **Protocolo SOS**: botón de pánico que notifica por **SMS + llamada** (Twilio) a tu contacto de emergencia.
- 👥 **Modo flotilla**: visualiza a otros conductores de la flota en el mapa.
- 💰 **Gastos de ruta**: registro de gastos asociados por recorrido.
- 📈 **Estadísticas de admin**: panel de administración con usuarios, planes, precios y soporte.

## 💳 Planes y pagos

| Plan | Descripción |
| --- | --- |
| 🆓 **Gratis** | Hasta 10 paradas por ruta. |
| ⭐ **Premium** | Paradas ilimitadas + optimización con tráfico real. |
| 🚛 **Flotilla** | Gestión de múltiples conductores y rutas. |

- 💳 Pagos vía **Stripe** (moneda **MXN**) y **PayPal** (suscripciones con renovación automática).

## 🔐 Autenticación

- 🔑 **Google OAuth** (NextAuth v4) + **email/contraseña** (bcrypt).
- 📱 **Firebase Auth** para el login nativo en Android (Capacitor).
- 🧑‍💻 **Panel de administración** con usuarios maestros.

## 🧱 Stack tecnológico

- ⚛️ **Next.js 16 + React 19 + TypeScript**
- 🍃 **MongoDB Atlas** (Mongoose + adapter NextAuth)
- 🗺️ **Google Maps API** (`@vis.gl/react-google-maps`)
- 🎨 **Tailwind CSS v4 + Framer Motion + lucide-react**
- 📱 **Capacitor** (Android nativo, geolocalización, notificaciones)
- 🔔 **react-hot-toast** para notificaciones

## 🚀 Desarrollo

```bash
# Instalar dependencias
npm install

# Crear variables de entorno a partir de la plantilla
cp .env.example .env   # y completa los valores

# Desarrollo
npm run dev

# Build de producción
npm run build
npm run start

# Lint
npm run lint
```

## ☁️ Despliegue

Listo para desplegar en **Vercel**. Los callbacks de Google OAuth y las URLs de Stripe/Maps deben estar registrados tanto para `http://localhost:3000` como para el dominio de producción.

---

Hecho con ❤️ por **Jandosoft**.
