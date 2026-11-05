/**
 * Páginas HTML que devuelve el Worker. Todo texto dinámico pasa por escapeHtml.
 */

/** @param {string} value */
export function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Serializa datos para incrustarlos dentro de <script>: escapa los caracteres que permitirían
 * cerrar la etiqueta, introducir HTML o romper el literal JavaScript.
 * @param {unknown} data
 */
export function toScriptJson(data) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(new RegExp(String.fromCharCode(0x2028), 'g'), '\\u2028')
    .replace(new RegExp(String.fromCharCode(0x2029), 'g'), '\\u2029');
}

/**
 * Página de error. Mensajes genéricos y fijos: no se reflejan parámetros de la petición.
 * @param {string} message
 */
export function errorPage(message) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Inicio de sesión · Deus</title>
  </head>
  <body>
    <main>
      <h1>No se pudo iniciar sesión</h1>
      <p>${escapeHtml(message)}</p>
      <p>Cerrá esta ventana y volvé a intentarlo desde el panel de administración.</p>
    </main>
  </body>
</html>
`;
}

/**
 * Página que entrega el token al panel de administración mediante postMessage.
 *
 * Protocolo (el mismo que espera el cliente de popup de Decap CMS):
 *  1. Esta página envía 'authorizing:github' al opener con targetOrigin '*'. No lleva secretos.
 *  2. El opener responde con el mismo mensaje desde su origen.
 *  3. Solo si el origen de esa respuesta está en la lista permitida se envía el token,
 *     con targetOrigin fijado a ese origen.
 *
 * @param {{ token: string, allowedOrigins: readonly string[], nonce: string }} params
 */
export function popupSuccessPage({ token, allowedOrigins, nonce }) {
  const data = toScriptJson({ token, origins: allowedOrigins });
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex" />
    <title>Inicio de sesión · Deus</title>
  </head>
  <body>
    <main>
      <p>Autorización completada. Esta ventana se cerrará.</p>
    </main>
    <script nonce="${nonce}">
      (function () {
        var config = ${data};
        var delivered = false;

        window.addEventListener('message', function (event) {
          if (delivered || !window.opener) return;
          if (config.origins.indexOf(event.origin) === -1) return;
          if (event.data !== 'authorizing:github') return;
          delivered = true;
          window.opener.postMessage(
            'authorization:github:success:' + JSON.stringify({ token: config.token, provider: 'github' }),
            event.origin
          );
        });

        if (window.opener) {
          window.opener.postMessage('authorizing:github', '*');
        }
      })();
    </script>
  </body>
</html>
`;
}
