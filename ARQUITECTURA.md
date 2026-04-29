# Clásica VBK 2026 — Arquitectura del sistema

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | WordPress plugin custom (`cvbk-inscripcion.php`) |
| Pasarela de pago | Getnet / PlaceToPay vía plugin WooCommerce |
| DB | MySQL (tablas WP custom) |
| Emails | `wp_mail` con templates HTML propios |
| QR | `api.qrserver.com` (imagen externa, sin librería PHP) |
| Deploy | Solo subir `/dist` al hosting + el PHP a WP |

---

## Rutas del repo

```
virtual-bike-landing/
├── cvbk-inscripcion.php       ← Plugin WP (backend completo)
├── src/
│   └── components/
│       ├── Inscripcion.jsx    ← Formulario + flujo de pago (pasos 1-3)
│       ├── DiaCarrera.jsx     ← Horarios + video del circuito
│       ├── Patrocinadores.jsx ← Grid de logos sponsors
│       ├── SponsorStrip.jsx   ← Banner animado de sponsors
│       ├── Beneficios.jsx     ← Lista de beneficios
│       └── PremiosDinero.jsx  ← Escalado de premios
├── public/
│   ├── sponsors/              ← Logos sponsors (jpg/jpeg)
│   └── images/                ← Fotos pesadas servidas directo desde el servidor (virtual13-16.webp)
└── dist/                      ← Build de producción (esto se sube al servidor)
```

---

## URLs

| Ambiente | URL |
|----------|-----|
| Landing producción | `https://virtual-bike.cl/clasica-2026/` |
| Dashboard admin | `https://virtual-bike.cl/clasica-admin/` |
| API base | `https://virtual-bike.cl/wp-json/cvbk/v1` |
| Dev local | `http://localhost:5173` |

---

## Tablas MySQL custom

| Tabla | Uso |
|-------|-----|
| `wp_cvbk_inscritos` | Inscripciones: id, order_id, nombre, apellido, email, telefono, rut, genero, categoria, club, estado_pago |
| `wp_cvbk_honeypot` | Log de bots y scanners |
| `wp_cvbk_eventos` | Funnel analytics (pageview, genero_click, formulario_inicio, reserva_ok, pago_ok) |

---

## Endpoints REST (`/wp-json/cvbk/v1/`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/reservar` | público | Paso 1: guarda inscrito en DB (sin pago), envía email de reserva |
| POST | `/pagar` | público | Paso 2: crea orden WC, redirige a Getnet |
| GET | `/inscrito/{id}` | público | Devuelve estado y QR del inscrito (usado post-pago) |
| GET | `/verificar?id=X&token=Y` | HMAC | Verifica inscripción — devuelve HTML para escanear QR |
| GET | `/inscritos` | JWT | Lista inscritos con filtros (categoria, genero, estado) |
| GET | `/inscritos/export` | JWT | Exporta CSV |
| PATCH | `/inscritos/{id}/estado` | JWT | Actualiza estado_pago manualmente |
| DELETE | `/inscritos/{id}` | JWT | Elimina inscrito |
| POST | `/auth` | público | Login → devuelve JWT (TTL 8h) |
| GET | `/stats?dias=X` | JWT | Funnel analytics + dispositivos + referrers |
| POST | `/track` | público | Registra evento de sesión |
| GET | `/run-check-pagos?token=X` | legacy token | Fuerza revisión de pagos pendientes |

---

## Flujo de inscripción

```
[Usuario]
  │
  ├─ 1. Elige género (Hombre/Mujer)
  ├─ 2. Llena formulario:
  │      RUT → Nombre → Apellido → Equipo o Libre
  │      → Categoría → Dorsal → Teléfono → Email
  ├─ 3. POST /reservar
  │      ├─ Guarda en wp_cvbk_inscritos (estado: pendiente)
  │      ├─ Email "Cupo reservado" al usuario
  │      └─ Agenda WP cron recordatorio 48h
  │
  ├─ 4. POST /pagar
  │      ├─ Crea orden WooCommerce
  │      ├─ Guarda inscrito_id en sessionStorage
  │      └─ Redirige a Getnet
  │
  ├─ 5. Usuario paga en Getnet
  │      └─ Getnet redirige a https://virtual-bike.cl/clasica-2026/
  │
  ├─ 6. Frontend detecta sessionStorage con inscrito_id
  │      └─ GET /inscrito/{id}
  │           ├─ estado_pago === 'pagado' → muestra Paso 3 con QR
  │           └─ estado_pago === 'pendiente' → muestra Paso 2 (pago aún procesando)
  │
  └─ 7. WC hook woocommerce_order_status_changed
         ├─ Actualiza estado en wp_cvbk_inscritos
         └─ Envía email "Pago confirmado" con QR
```

---

## Sistema QR

- **Token HMAC**: `hash_hmac('sha256', 'cvbk_verificar_' . $id, CVBK_JWT_SECRET)`
- **URL verificación**: `/cvbk/v1/verificar?id=X&token=Y`
- **Al escanear**: devuelve página HTML — verde si pagado, rojo si pendiente
- **Imagen QR**: generada por `api.qrserver.com` (300×300 en pantalla, 180×180 en email)

---

## Emails

| # | Cuándo | Función | Contenido |
|---|--------|---------|-----------|
| 1 | Al reservar (paso 1) | `cvbk_email_reserva()` | Link de pago `?pagar=ID` |
| 2 | Al confirmar pago | `cvbk_email_pago_confirmado()` | QR de acreditación |
| 3 | 48h sin pago (WP Cron) | `cvbk_email_recordatorio()` | Link de pago de vuelta |
| 4 | 18 mayo 09:00 CL | `cvbk_email_logistica()` | Info del evento a todos los pagados |

- From: `clasica2026@virtual-bike.cl`
- WC emails nativos desactivados con `add_filter('woocommerce_email_enabled_*', '__return_false')`
- Al confirmar pago también se notifica a `clasica2026@virtual-bike.cl`

---

## WP Cron jobs

| Hook | Cuándo | Qué hace |
|------|--------|---------|
| `cvbk_recordatorio_pago` | 48h post-reserva | Email recordatorio si sigue pendiente |
| `cvbk_check_pagos` | Cada 5 min | Sincroniza órdenes WC → marca pagado + envía email |
| `cvbk_email_logistica_evento` | 18 mayo 2026 09:00 CL | Email info del evento a todos los pagados |

---

## Auth y acceso

- **JWT HS256** propio, TTL 8h, header `X-CVBK-Token`
- **Usuarios**: `seb` y `carlos` (passwords en el plugin)
  - `seb` — acceso a todos los endpoints incluyendo honeypot log
  - `carlos` — acceso solo a inscritos
- **IP whitelist** (`CVBK_RL_WHITELIST`): `45.236.124.212`
  - Exenta de rate limit y bloqueo de inscripciones antes del 1 de mayo
  - Precio de prueba: $50 CLP (override en `cvbk_pagar()`)

---

## Control de apertura de inscripciones

- **Fecha**: 1 de mayo 2026 00:00 (UTC-4)
- **Frontend**: `INSCRIPCIONES_ABIERTAS = new Date() >= new Date('2026-05-01T00:00:00-04:00')`
- **Backend**: check en `cvbk_reservar()` con `strtotime('2026-05-01 00:00:00 -0400')`
- IPs en whitelist pueden inscribirse siempre

---

## Seguridad

| Mecanismo | Dónde |
|-----------|-------|
| Honeypot field `_hp` en formulario | Front + back ignora si viene relleno |
| Timestamp anti-bot `_t` (rechaza < 3s) | `cvbk_reservar()` |
| Rate limit por IP (WP transients) | `/reservar` y `/pagar` |
| Validación RUT módulo 11 | Front (`validarRut`) + back (`cvbk_validar_rut`) |
| Deduplicación por RUT | `cvbk_reservar()` antes de insertar |
| Honeypot trap para bots/scanners | `template_redirect` — URIs trampa, UAs de scanners, SQLi/XSS en QS |
| CORS restringido | `virtual-bike.cl` + `localhost:5173/4173` |

---

## Getnet / PlaceToPay

- Plugin WC: `placetopay`
- URL de conexión personalizada: `https://virtual-bike.cl/?wc-api=getnet`
- Return URL: configurada como "Página por defecto" en WP Admin → WooCommerce → Getnet
  - Interceptada en `woocommerce_api_getnet` priority 99 → redirige a `clasica-2026/`
- El front usa `sessionStorage('cvbk_pending_id')` para identificar al inscrito al volver

---

## Pendientes

- [ ] Rangos de dorsal por categoría (el cliente aún no los define)
- [ ] Si el cron no procesó el pago cuando el usuario vuelve (hasta 5 min de delay), mostrar "verificando pago..." con polling
