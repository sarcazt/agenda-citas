# Agenda de citas

Aplicación web (Next.js, App Router, TypeScript, Tailwind) para agendar citas. El formulario envía los datos a un webhook de Make (Escenario 1), que decide el estado de la cita y la guarda en Google Sheets. La app lee esa hoja para mostrar la agenda del día.

## Vistas y rutas

| Ruta | Descripción |
| --- | --- |
| `/agendar` | Formulario de cita. Muestra `confirmada`, `con_alerta`, `rechazada` o un error genérico. |
| `/agenda` | Citas de una fecha (por defecto hoy en America/Bogota), con estado y total. No muestra correos. |
| `POST /api/agendar` | Valida con zod, llama al webhook de Make (máx. 20 s) y devuelve la respuesta normalizada. |
| `GET /api/agenda?fecha=YYYY-MM-DD` | Lee la hoja y devuelve las citas de la fecha, sin correo. |
| `GET /api/health` | Devuelve `{ "ok": true }` (healthcheck). |

## Contrato con Make

**La app envía** (POST JSON al webhook):

```json
{
  "nombre": "string",
  "correo": "string",
  "fecha": "YYYY-MM-DD",
  "franja": "HH:mm",
  "observaciones": "string o vacío"
}
```

**Make debe responder** (módulo Webhook response, código 200, JSON):

```json
{
  "estado": "confirmada | con_alerta | rechazada",
  "mensaje": "texto para mostrar al cliente",
  "cupos_libres": 0
}
```

Cualquier otra cosa (código distinto de 200, JSON inválido, `estado` desconocido o más de 20 s de espera) se trata como error y el cliente ve un mensaje genérico.

**Hoja de Google Sheets** (fila 1 = encabezados): `id | fecha | franja | nombre | correo | estado | creado_en`.
Make escribe las filas; la app solo las lee y filtra por `fecha`. Las columnas se ubican por el nombre del encabezado, y la columna `fecha` debe guardar texto `YYYY-MM-DD` (formato de celda "Texto plano" para que Sheets no la convierta en fecha).

## Variables de entorno

Copia `.env.example` a `.env.local` para desarrollo.

| Variable | Descripción |
| --- | --- |
| `MAKE_WEBHOOK_URL` | URL del webhook del Escenario 1. Solo se usa en el servidor. |
| `GOOGLE_SHEET_ID` | ID de la hoja (la parte entre `/d/` y `/edit` en su URL). |
| `GOOGLE_SHEET_TAB` | Nombre de la pestaña. Por defecto `Citas`. |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Correo de la cuenta de servicio. |
| `GOOGLE_PRIVATE_KEY` | Clave privada de la cuenta de servicio. Acepta `\n` escapados. |
| `CUPO_POR_FRANJA` | Cupo por franja (solo la usará `/franjas`). |
| `FRANJAS` | Franjas separadas por coma, p. ej. `08:00,09:00,10:00`. |
| `MAKE_MOCK` | `true` para no llamar a Make y simular respuestas. |

### Cuenta de servicio de Google

1. En Google Cloud, habilita la **Google Sheets API** y crea una cuenta de servicio.
2. Genera una clave JSON y copia `client_email` y `private_key` a las variables.
3. Comparte la hoja con el correo de la cuenta de servicio (permiso de lector basta).

## Modo simulado

Con `MAKE_MOCK=true`, `/api/agendar` responde según la franja:

| Franja | Resultado |
| --- | --- |
| `09:00` | `confirmada` |
| `10:00` | `con_alerta` |
| `11:00` | `rechazada` |
| `14:00` | error (respuesta inválida) |
| `15:00` | error (tiempo agotado) |
| otras | `confirmada` |

## Desarrollo

```bash
npm install
cp .env.example .env.local   # y pon MAKE_MOCK=true
npm run dev                  # http://localhost:3000
```

## Docker

```bash
docker build -t agenda-citas .
docker run -p 3000:3000 --env-file .env.local agenda-citas
curl http://localhost:3000/api/health
```

La imagen no contiene secretos: todo llega por variables de entorno en tiempo de ejecución.

## Despliegue en Dokploy

1. En Dokploy crea una **Application** y conéctala al repositorio de GitHub (rama `main`).
2. En *Build Type* elige **Dockerfile** (ruta `./Dockerfile`).
3. En la pestaña **Environment** pega las variables del `.env.example` con sus valores reales. Para `GOOGLE_PRIVATE_KEY` pega la clave en una sola línea con los `\n` literales.
4. En **Domains** asigna el dominio y el puerto `3000`.
5. Pulsa **Deploy**. Comprueba `https://<tu-dominio>/api/health`.

### Auto Deploy desde GitHub

1. En la aplicación, abre la pestaña **Deployments** (o **General**) y activa **Auto Deploy**.
2. Dokploy muestra una **Webhook URL**. Cópiala.
3. En GitHub: *Settings → Webhooks → Add webhook*, pega esa URL, *Content type* `application/json`, evento **Just the push event**.
4. Cada `push` a la rama configurada dispara un nuevo despliegue.

Si usas la integración con la app de GitHub de Dokploy, el webhook se crea solo al activar Auto Deploy.
