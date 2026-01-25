
# Guía de Instalación Firebase (Obligatorio)

Para que el Login funcione, necesitas conectar tu App con Firebase.

## Paso 1: Crear Proyecto
1. Ve a [Firebase Console](https://console.firebase.google.com/).
2. Crea un nuevo proyecto (ej: `hormiruta-app`).
3. Desactiva Google Analytics si quieres ir rápido (opcional).

## Paso 2: Registrar App Android
1. En el panel de Firebase, haz clic en el icono de **Android**.
2. **Paquete del Android**: `com.hormiruta.app` (Es muy importante que sea este exacto).
3. **Nombre**: Hormiruta.
4. **SHA-1**: (CRÍTICO) Necesitas la huella digital de tu ordenador.
   - Abre tu terminal en el proyecto y ejecuta: `cd android && ./gradlew signingReport`
   - Busca el **SHA-1** que aparece bajo `Task :app:signingReport` > `Store: debug.keystore`.
   - Copia ese código (ej: `DA:39:A3...`) y pégalo en Firebase.

## Paso 3: Descargar Archivo Config
1. Descarga el archivo `google-services.json`.
2. Mueve ese archivo a la carpeta: `hormiruta/android/app/google-services.json`.

## Paso 4: Activar Autenticación
1. En Firebase > **Authentication** > **Sign-in method**.
2. Activa **Google**.
3. Dale a Guardar.

¡Listo! Con esto hecho, tu app podrá conectarse a Google sin errores.
