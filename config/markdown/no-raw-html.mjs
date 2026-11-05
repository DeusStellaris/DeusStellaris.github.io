/**
 * Plugin mdast de Sätteri: elimina todo HTML crudo del Markdown editorial.
 *
 * El contenido de proyectos lo escribe Decap CMS. Ningún elemento HTML (ni scripts, iframes
 * o manejadores de eventos) debe llegar al sitio desde el Markdown. Los nodos `html` (bloque
 * e inline) se retiran del árbol antes de generar el HTML.
 */
export const noRawHtml = {
  name: 'deus-no-raw-html',
  html(node, context) {
    context.removeNode(node);
  },
};
