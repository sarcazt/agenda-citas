# Agenda de citas

Aplicación web (Next.js, App Router, TypeScript, Tailwind) para agendar citas. El formulario envía los datos a un webhook de Make (Escenario 1), que decide el estado de la cita y la guarda en Google Sheets. La app lee esa hoja para mostrar la agenda del día.

## Vistas y rutas

| Ruta | Descripción |
| --- | --- |
| `/agendar` | Formulario de cita. Muestra `confirmada`, `con_alerta`, `rechazada` o un error genérico. |
| `/agenda` | Citas de una fecha (por defecto hoy en America/Bogota), con hora, propietario, mascota y servicio, y el total. No muestra correos. |
| `POST /api/agendar` | Valida con zod, llama al webhook de Make (máx. 20 s) y devuelve la respuesta normalizada. |
| `GET /api/agenda?fecha=YYYY-MM-DD` | Lee la hoja y devuelve las citas de la fecha, sin correo. |
| `GET /api/health` | Devuelve `{ "ok": true }` (healthcheck). |

## Contrato con Make

**La app envía** (POST JSON al webhook):

```json
{
  "propietario": "María López",
  "correo": "maria@example.com",
  "mascota": "Luna",
  "especie": "Gato",
  "servicio": "Consulta general",
  "fecha": "2026-10-14",
  "hora": "10:00",
  "observaciones": "string o vacío (campo extra, Make puede ignorarlo)"
}
```

`fecha` (`AAAA-MM-DD`) y `hora` (`HH:MM`) llegan en esos formatos exactos para que Make construya la clave de franja y la busque en Google Sheets.

**Make debe responder** (módulo Webhook response, código 200, JSON):

```json
{
  "estado": "confirmada | con_alerta | rechazada",
  "mensaje": "texto para mostrar al cliente",
  "cupos_libres": 0
}
```

`cupos_libres` es opcional: si Make no lo envía, la app simplemente no muestra los cupos.

Cualquier otra cosa (código distinto de 200, JSON inválido, `estado` desconocido o más de 20 s de espera) se trata como error y el cliente ve un mensaje genérico.

**Hoja de Google Sheets** (fila 1 = encabezados): `id_cita | fecha_solicitud | propietario | correo | mascota | especie | servicio | fecha | hora`.
Make escribe las filas; la app solo las lee y filtra por `fecha`. Las columnas se ubican por el nombre del encabezado. `fecha` se acepta como `AAAA-MM-DD` o `D/M/AAAA`, y `hora` como `HH:MM` o `HH:MM:SS`. La hoja no guarda el estado de la cita, por eso `/agenda` no lo muestra.

## Variables de entorno

Copia `.env.example` a `.env.local` para desarrollo.

| Variable | Descripción |
| --- | --- |
| `MAKE_WEBHOOK_URL` | URL del webhook del Escenario 1. Solo se usa en el servidor. |
| `GOOGLE_SHEET_ID` | ID de la hoja (la parte entre `/d/` y `/edit` en su URL). |
| `GOOGLE_SHEET_TAB` | Nombre de la pestaña. Por defecto `citas`. |
| `CUPO_POR_FRANJA` | Cupo por franja (solo la usaría `/franjas`, que no está implementada). |
| `FRANJAS` | Franjas separadas por coma, p. ej. `08:00,09:00,10:00`. |

### Acceso a la hoja

La app lee la hoja como CSV público, sin credenciales. Por eso la hoja debe estar compartida como **"Cualquier persona con el enlace puede ver"**. Ten en cuenta que, al ser pública, cualquiera con el enlace ve también la columna `correo`; la app solo la oculta en `/agenda`.

## Desarrollo

```bash
npm install
cp .env.example .env.local   # y completa los valores
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
3. En la pestaña **Environment** pega las variables del `.env.example` con sus valores reales.4. En **Domains** asigna el dominio y el puerto `3000`.
5. Pulsa **Deploy**. Comprueba `https://<tu-dominio>/api/health`.

### Auto Deploy desde GitHub

1. En la aplicación, abre la pestaña **Deployments** (o **General**) y activa **Auto Deploy**.
2. Dokploy muestra una **Webhook URL**. Cópiala.
3. En GitHub: *Settings → Webhooks → Add webhook*, pega esa URL, *Content type* `application/json`, evento **Just the push event**.
4. Cada `push` a la rama configurada dispara un nuevo despliegue.

Si usas la integración con la app de GitHub de Dokploy, el webhook se crea solo al activar Auto Deploy.
