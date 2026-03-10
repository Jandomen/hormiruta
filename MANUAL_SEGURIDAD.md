# 🛡️ Manual de Seguridad: Bóveda Hormiruta

Este sistema utiliza cifrado grado militar (AES-256-CBC) para proteger las llaves de API y secretos del proyecto.

## 🔑 Conceptos Clave
- **.env.vault**: Es el baúl donde se guardan tus llaves encriptadas. Se puede subir a GitHub sin riesgo.
- **Llave Maestra**: Es la única frase que puede abrir el baúl. **NO LA COMPARTAS.**
- **Carga en Memoria**: El comando `load` permite que la app funcione sin necesidad de tener un archivo `.env.local` físico en el disco duro.

## 🛠️ Comandos de Uso

### 1. Sellar la Bóveda (Seal)
Usa este comando antes de entregar el código o subirlo a la nube:
```bash
node security-vault.mjs seal "TU_FRASE_SECRETA"
```
*Resultado: Crea `env.vault`. Ya puedes borrar tu `.env.local`.*

### 2. Abrir la Bóveda (Open)
Usa este comando para restaurar el archivo físico y poder editarlo:
```bash
node security-vault.mjs open "TU_FRASE_SECRETA"
```
*Resultado: Restaura el archivo `.env.local`.*

### 3. Carga Invisible (Load)
Ideal para servidores o para máxima seguridad local:
```bash
node security-vault.mjs load "TU_FRASE_SECRETA"
```
*Resultado: Inyecta las llaves en la memoria RAM del proceso actual. No crea archivos.*

---

## 📈 Estrategia para Clientes
1. Tú mantienes la **Llave Maestra**.
2. Solo tú puedes "abrir" la configuración para hacer mantenimiento.
3. Si el cliente tiene el servidor, tú configuras la Llave Maestra en sus variables de entorno (como MASTER_KEY) y ellos nunca verán el contenido real de tus llaves de Stripe o Google.

---
© 2026 Hormiruta Security Protocol.
