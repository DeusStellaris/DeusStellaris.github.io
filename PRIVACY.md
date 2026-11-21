# Política de Privacidad / Privacy Policy

**Software:** Portafolio Deus (sitio web, API y demos jugables)
**Responsable / Controller:** Noé Ezequiel Martinez (Deus)
**Contacto / Contact:** canal de contacto publicado en el sitio / contact channel published on the site
**Versión / Version:** 2026-11-19.1

Resumen técnico. La política vinculante es la publicada en el sitio (`/privacidad/` y `/en/privacy/`), con la misma versión.
Technical summary. The binding policy is the one published on the site (`/privacidad/` and `/en/privacy/`), with the same version.

## Español

### 1. Principio

Privacidad por diseño y local primero: las preferencias (tema, Modo Lite, favoritos, perfil, avisos) viven en tu navegador y no se envían a ningún servidor propio. Ninguna función que guarde datos en el servidor se activa sin una acción tuya.

### 2. Datos que se procesan

- **Me gusta y reseñas:** un identificador anónimo y aleatorio, guardado en el servidor solo como HMAC. Las reseñas guardan puntuación, comentario de texto plano, idioma y fecha.
- **Avisos push (opcionales):** dirección de entrega y claves de cifrado del navegador, modo, categorías o proyectos e idioma. Darte de baja borra el registro.
- **Cuenta (opcional):** correo solo como HMAC, contraseña solo como hash PBKDF2-SHA256 y, si lo pedís, un respaldo de preferencias. Sesión en cookie `__Host-deus_session` de una hora, `HttpOnly`, `Secure` y `SameSite=Strict`.
- **Consentimientos:** tipo, versión del documento, idioma, fecha UTC y un HMAC de la sesión de consentimiento. Sin nombre, correo ni IP.
- **Rendimiento (RUM):** Web Vitals (LCP, INP, CLS, FCP, TTFB) de una muestra del 10 % de visitas: métrica, valor y ruta. Sin cookies, identificadores ni IP; no se guardan en base de datos. Se omite con Do Not Track, Global Privacy Control o ahorro de datos.
- **IP:** solo de forma transitoria para limitar la frecuencia de solicitudes, guardada como HMAC.

### 3. Terceros

No se venden ni comparten datos personales. Proveedores técnicos: Cloudflare (Pages y Workers), Supabase (base de datos), GitHub (repositorio, administración y comentarios con giscus a pedido) y los servicios push del navegador si activás avisos.

### 4. Tus derechos y borrado

Podés acceder, rectificar o eliminar tus datos: reseñas, me gusta, suscripción push, cuenta con su respaldo y registro de consentimientos. Usá el enlace «Solicitar borrado de datos» del pie de página. Las preferencias locales se borran desde tu navegador. La Agencia de Acceso a la Información Pública es el órgano de control de la Ley 25.326 en Argentina.

### 5. Cambios

Los cambios se publican con nueva versión en el sitio y en este archivo.

## English

### 1. Principle

Privacy by design and local-first: preferences (theme, Lite Mode, favorites, profile, notifications) live in your browser and are never sent to a server of ours. No feature that stores data on the server turns on without your action.

### 2. Data processed

- **Likes and reviews:** a random anonymous identifier, stored on the server only as an HMAC. Reviews store rating, plain-text comment, language and date.
- **Push notifications (optional):** browser delivery address and encryption keys, mode, categories or projects and language. Unsubscribing deletes the record.
- **Account (optional):** email only as an HMAC, password only as a PBKDF2-SHA256 hash and, if you ask for it, a preferences backup. One-hour `__Host-deus_session` cookie, `HttpOnly`, `Secure` and `SameSite=Strict`.
- **Consents:** type, document version, language, UTC date and an HMAC of the consent session. No name, email or IP.
- **Performance (RUM):** Web Vitals (LCP, INP, CLS, FCP, TTFB) from a 10% sample of visits: metric, value and path. No cookies, identifiers or IP; not stored in a database. Skipped with Do Not Track, Global Privacy Control or data saver.
- **IP:** only transiently to rate-limit requests, stored as an HMAC.

### 3. Third parties

Personal data is neither sold nor shared. Technical providers: Cloudflare (Pages and Workers), Supabase (database), GitHub (repository, admin and on-demand giscus comments) and browser push services if you turn notifications on.

### 4. Your rights and deletion

You may access, correct or delete your data: reviews, likes, push subscription, account with its backup and consent record. Use the "Request data deletion" link in the footer. Local preferences are cleared from your browser.

### 5. Changes

Changes are published with a new version on the site and in this file.
