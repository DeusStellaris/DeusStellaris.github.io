# Documentación legal: estado y alcance

## Qué hay

Seis documentos publicados en `/terminos/`, `/privacidad/`, `/cookies/` y sus equivalentes en inglés (`/en/terms/`, `/en/privacy/`, `/en/cookies/`):

- **Términos y condiciones de uso.**
- **Política de privacidad**, con referencias al RGPD (Unión Europea), la CCPA (California) y la Ley 25.326 (Argentina).
- **Política de cookies y almacenamiento local.**

Cada documento muestra el aviso **«PENDIENTE DE REVISIÓN LEGAL — BORRADOR NO DEFINITIVO»** en la parte superior, no ocultable por estilos. La versión en inglés incluye además la frase exacta en español. Una prueba de build verifica que el aviso esté presente en las seis páginas.

## Qué NO afirman

- No son asesoramiento jurídico. No garantizan el cumplimiento de ninguna norma.
- No declaran bases jurídicas, plazos de conservación ni transferencias internacionales: esos puntos aparecen como **marcadores pendientes** visibles.
- No describen prácticas que el sitio no tenga. El texto sobre datos se deriva del código: qué se guarda en el navegador, qué calcula el servidor (HMAC, nunca datos en claro) y qué proveedores intervienen.

## Datos pendientes

El inventario completo de los 34 marcadores está en [`pending-data.md`](./pending-data.md), generado a partir del HTML construido para que coincida con lo que ve el visitante.

Los datos del titular se completan en `src/config/legal.json` (sección `controller`): nombre, forma jurídica, domicilio, correo y contacto de protección de datos. Mientras sean `null`, aparecen como marcador en los documentos. No se han inventado.

## Consentimiento: qué garantiza el código y qué no

- **Tres decisiones independientes:** aceptación de términos (obligatoria para continuar con el aviso), aceptación de la política de privacidad (obligatoria) y preferencia de publicidad (opcional, desmarcada por defecto).
- **Casillas desmarcadas**: ninguna aceptación viene marcada de origen. El envío queda bloqueado mientras falte una obligatoria.
- **Registro con hora del servidor.** La hora la pone PostgreSQL (`now()`, UTC). El cliente no puede enviarla ni influir en ella.
- **Una aceptación solo se muestra como registrada** cuando el servidor la confirma. Sin Supabase o sin el Worker, queda como «pendiente de registro» y el sitio lo dice. No se simula un registro.
- **Versiones.** El servidor rechaza cualquier versión que no coincida con la vigente. Una prueba verifica que la versión del servidor sea igual a la de `legal.json`.
- **Registro inmutable.** Un trigger impide modificar o borrar registros, incluso con la clave de servicio. Un cambio de decisión se registra como un evento nuevo.
- **Qué no se registra:** nombre, correo ni IP. Solo un HMAC del identificador anónimo de sesión.

Estas garantías son técnicas. **Que el diseño del consentimiento cumpla los requisitos legales de cada jurisdicción es una cuestión para revisión profesional.** En particular, la forma de obtener y documentar el consentimiento debe confirmarse con un profesional antes de publicar.

## Revisión necesaria antes de publicar como definitivo

1. Completar los 34 datos pendientes (`pending-data.md`).
2. Revisión jurídica de cada documento, en ambos idiomas, por un profesional habilitado en las jurisdicciones aplicables.
3. Confirmar la clasificación de cada almacenamiento (esencial o preferencia) y si requiere consentimiento.
4. Confirmar si el sitio vende o comparte datos personales en el sentido de la CCPA.
5. Confirmar la autoridad de control vigente en Argentina y el procedimiento de ejercicio de derechos.
6. Retirar el aviso de borrador solo tras la revisión, y cambiar la versión del documento en `legal.json`.
