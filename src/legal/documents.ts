import type { LegalLocale } from './segments';

/**
 * Contenido de los documentos legales (borrador). Describe el tratamiento técnico real del sitio.
 * Lo que requiere decisión jurídica o datos del titular se marca como {{PENDING:...}}.
 * Ningún documento afirma cumplimiento normativo ni sustituye asesoramiento profesional.
 */

export type DocumentKind = 'terms' | 'privacy' | 'cookies' | 'refund' | 'eula';

export interface LegalSection {
  heading: string;
  paragraphs: string[];
  items?: string[];
}

export interface LegalDocumentContent {
  title: string;
  intro: string;
  sections: LegalSection[];
}

/*
 * Política de reembolso: borrador preparado para una futura actividad comercial. No define productos,
 * precios, plazos ni garantías porque hoy el sitio no cobra nada. Cualquier condición real se redacta
 * y revisa antes de cobrar por primera vez.
 */
const REFUND: Record<LegalLocale, LegalDocumentContent> = {
  es: {
    title: 'Política de reembolso',
    intro:
      'Este sitio es un portafolio personal. Hoy no vende productos ni cobra servicios a través de sus páginas, así que esta política no define condiciones de compra todavía.',
    sections: [
      {
        heading: '1. Estado actual',
        paragraphs: [
          'En este momento el sitio no procesa pagos ni ofrece compras en línea. Los encargos freelance se coordinan por el canal de contacto y no tienen un cobro automático en el sitio.',
        ],
      },
      {
        heading: '2. Encargos freelance',
        paragraphs: [
          'Cada encargo se rige por un acuerdo escrito separado, que deberá indicar su alcance, precio, forma de pago y condiciones de cancelación y reembolso. {{PENDING:condiciones de cancelación y reembolso en los acuerdos de servicio, a redactar y revisar por profesional}}',
        ],
      },
      {
        heading: '3. Productos o servicios futuros',
        paragraphs: [
          'Si en el futuro se ofrecen productos o servicios de pago en este sitio, esta política se actualizará antes del primer cobro, con los plazos, condiciones y procedimiento de reembolso que correspondan. {{PENDING:condiciones comerciales y de reembolso, a definir cuando exista actividad comercial}}',
        ],
      },
      {
        heading: '4. Consultas',
        paragraphs: [
          'Para consultas sobre esta política, usá el canal de contacto del sitio. {{PENDING:correo de contacto}}',
        ],
      },
      {
        heading: '5. Vigencia',
        paragraphs: [
          'Esta política tiene una versión con fecha visible. {{PENDING:revisión legal de esta política}}',
        ],
      },
    ],
  },
  en: {
    title: 'Refund policy',
    intro:
      'This site is a personal portfolio. It does not currently sell products or charge for services through its pages, so this policy does not set purchase conditions yet.',
    sections: [
      {
        heading: '1. Current status',
        paragraphs: [
          'At the moment the site does not process payments or offer online purchases. Freelance work is arranged through the contact channel and is not charged automatically on the site.',
        ],
      },
      {
        heading: '2. Freelance work',
        paragraphs: [
          'Each engagement is governed by a separate written agreement, which must state its scope, price, payment method and cancellation and refund terms. {{PENDING:cancellation and refund terms in service agreements, to be drafted and reviewed by a professional}}',
        ],
      },
      {
        heading: '3. Future products or services',
        paragraphs: [
          'If paid products or services are offered on this site in the future, this policy will be updated before the first charge, with the time frames, conditions and refund procedure that apply. {{PENDING:commercial and refund conditions, to be defined once there is commercial activity}}',
        ],
      },
      {
        heading: '4. Questions',
        paragraphs: [
          'For questions about this policy, use the site contact channel. {{PENDING:contact email}}',
        ],
      },
      {
        heading: '5. Validity',
        paragraphs: [
          'This policy has a visible dated version. {{PENDING:legal review of this policy}}',
        ],
      },
    ],
  },
};

/*
 * EULA de DeusDeck, basado en la plantilla de _Deus_Assets/legal/EULA_TEMPLATE.md. Incluye la cláusula
 * AS-IS. Es un borrador: la versión del instalador y la revisión jurídica quedan marcadas como pendientes.
 */
const EULA: Record<LegalLocale, LegalDocumentContent> = {
  es: {
    title: 'EULA de DeusDeck',
    intro:
      'Acuerdo de licencia de usuario final de DeusDeck. Titular: Noé Ezequiel Martinez (Deus). {{PENDING:versión del instalador a la que aplica este acuerdo y fecha de entrada en vigor}}',
    sections: [
      {
        heading: '1. Licencia',
        paragraphs: [
          'Se concede al usuario una licencia personal, no exclusiva e intransferible para instalar y usar el software conforme a este acuerdo.',
        ],
      },
      {
        heading: '2. Restricciones',
        paragraphs: [
          'El usuario no debe descompilar, redistribuir ni sublicenciar el software, salvo lo permitido por las licencias de código abierto de sus componentes.',
        ],
      },
      {
        heading: '3. Provisto «tal cual» (AS-IS)',
        paragraphs: [
          'EL SOFTWARE SE ENTREGA «TAL CUAL» Y «SEGÚN DISPONIBILIDAD», SIN GARANTÍAS DE NINGÚN TIPO, EXPRESAS O IMPLÍCITAS, INCLUIDAS LAS DE COMERCIABILIDAD, IDONEIDAD PARA UN FIN PARTICULAR Y NO INFRACCIÓN.',
        ],
      },
      {
        heading: '4. Limitación de responsabilidad',
        paragraphs: [
          'EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY, EL TITULAR NO SERÁ RESPONSABLE POR DAÑOS DIRECTOS, INDIRECTOS, INCIDENTALES O PÉRDIDA DE DATOS DERIVADOS DEL USO O LA IMPOSIBILIDAD DE USO DEL SOFTWARE.',
        ],
      },
      {
        heading: '5. Privacidad',
        paragraphs: ['El tratamiento de datos se rige por la Política de privacidad del sitio.'],
      },
      {
        heading: '6. Ley aplicable',
        paragraphs: [
          'Este acuerdo se rige por las leyes de la República Argentina. Jurisdicción: tribunales ordinarios de la Ciudad Autónoma de Buenos Aires. {{PENDING:revisión legal de este acuerdo}}',
        ],
      },
    ],
  },
  en: {
    title: 'DeusDeck EULA',
    intro:
      'End user license agreement for DeusDeck. Licensor: Noé Ezequiel Martinez (Deus). {{PENDING:installer version this agreement applies to and effective date}}',
    sections: [
      {
        heading: '1. License',
        paragraphs: [
          'The user is granted a personal, non-exclusive, non-transferable license to install and use the software under this agreement.',
        ],
      },
      {
        heading: '2. Restrictions',
        paragraphs: [
          'The user must not decompile, redistribute or sublicense the software, except as allowed by the open-source licenses of its components.',
        ],
      },
      {
        heading: '3. Provided "AS-IS"',
        paragraphs: [
          'THE SOFTWARE IS PROVIDED "AS IS" AND "AS AVAILABLE", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT.',
        ],
      },
      {
        heading: '4. Limitation of liability',
        paragraphs: [
          'TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE LICENSOR SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT OR INCIDENTAL DAMAGES OR LOSS OF DATA ARISING FROM THE USE OR INABILITY TO USE THE SOFTWARE.',
        ],
      },
      {
        heading: '5. Privacy',
        paragraphs: ['Data handling is governed by the Privacy policy of this site.'],
      },
      {
        heading: '6. Governing law',
        paragraphs: [
          'This agreement is governed by the laws of the Argentine Republic. Venue: ordinary courts of the Autonomous City of Buenos Aires. {{PENDING:legal review of this agreement}}',
        ],
      },
    ],
  },
};

export const DOCUMENTS: Record<DocumentKind, Record<LegalLocale, LegalDocumentContent>> = {
  refund: REFUND,
  eula: EULA,
  terms: {
    es: {
      title: 'Términos y condiciones de uso',
      intro: 'Estas condiciones regulan el uso de este sitio, el portafolio personal de Deus.',
      sections: [
        {
          heading: '1. Objeto',
          paragraphs: [
            'El sitio presenta proyectos técnicos, contenido sobre desarrollo de entornos y servicios freelance. El contenido se ofrece con fines informativos.',
            'Publicar información aquí no constituye una oferta vinculante de servicios. Cualquier encargo se rige por un acuerdo escrito separado.',
          ],
        },
        {
          heading: '2. Propiedad del contenido',
          paragraphs: [
            'Los textos, imágenes y descripciones publicados pertenecen a su titular o se usan con permiso. {{PENDING:licencia de uso y reutilización del contenido}}',
          ],
        },
        {
          heading: '3. Uso permitido',
          paragraphs: [
            'Puedes navegar, consultar y compartir enlaces al sitio. No está permitido:',
          ],
          items: [
            'Intentar acceder al panel de administración o a la API sin autorización.',
            'Automatizar envíos masivos a la API de me gusta o a los formularios de consentimiento.',
            'Introducir código malicioso o intentar eludir las medidas de seguridad del sitio.',
            'Usar el contenido de forma que induzca a error sobre su autoría o sobre las capacidades descritas.',
          ],
        },
        {
          heading: '4. Funciones del sitio',
          paragraphs: [
            'Los favoritos y el perfil local se guardan solo en tu navegador. Los me gusta se registran de forma agregada con un identificador anónimo. Los comentarios se gestionan a través de GitHub y se rigen también por sus condiciones.',
          ],
        },
        {
          heading: '5. Enlaces a terceros',
          paragraphs: [
            'El sitio enlaza a servicios de terceros (por ejemplo, GitHub). No controlamos sus contenidos ni sus políticas.',
          ],
        },
        {
          heading: '6. Disponibilidad y responsabilidad',
          paragraphs: [
            'El sitio se ofrece tal cual está. {{PENDING:cláusulas de disponibilidad y limitación de responsabilidad, a redactar y revisar por profesional}}',
          ],
        },
        {
          heading: '7. Aceptación',
          paragraphs: [
            'La aceptación de estos términos se registra en el servidor cuando el servicio de registro está disponible, indicando la versión vigente y la fecha y hora en UTC. Mientras el registro no esté disponible, el sitio no lo declara como aceptado.',
          ],
        },
        {
          heading: '8. Cambios',
          paragraphs: [
            'Podemos actualizar estos términos. Cada versión tiene un identificador de fecha visible en esta página. Si cambian de forma relevante, se pedirá la aceptación de la nueva versión.',
          ],
        },
        {
          heading: '9. Ley aplicable y contacto',
          paragraphs: [
            'Ley aplicable y jurisdicción: {{PENDING:ley aplicable y tribunales competentes}}.',
            'Contacto: {{EMAIL}}.',
          ],
        },
      ],
    },
    en: {
      title: 'Terms and conditions of use',
      intro: 'These terms govern the use of this site, the personal portfolio of Deus.',
      sections: [
        {
          heading: '1. Purpose',
          paragraphs: [
            'The site presents technical projects, content about environment development and freelance services. Content is provided for information purposes.',
            'Publishing information here is not a binding offer of services. Any engagement is governed by a separate written agreement.',
          ],
        },
        {
          heading: '2. Ownership of content',
          paragraphs: [
            'Published texts, images and descriptions belong to their owner or are used with permission. {{PENDING:license and reuse terms for the content}}',
          ],
        },
        {
          heading: '3. Permitted use',
          paragraphs: [
            'You may browse, read and share links to the site. The following is not permitted:',
          ],
          items: [
            'Attempting to access the admin panel or the API without authorization.',
            'Automating bulk submissions to the likes API or to the consent forms.',
            'Introducing malicious code or trying to bypass the security measures of the site.',
            'Using the content in a way that misleads about its authorship or the capabilities described.',
          ],
        },
        {
          heading: '4. Site features',
          paragraphs: [
            'Favorites and the local profile are stored only in your browser. Likes are recorded in aggregate with an anonymous identifier. Comments are managed through GitHub and are also subject to its terms.',
          ],
        },
        {
          heading: '5. Third-party links',
          paragraphs: [
            'The site links to third-party services (for example, GitHub). We do not control their content or policies.',
          ],
        },
        {
          heading: '6. Availability and liability',
          paragraphs: [
            'The site is provided as is. {{PENDING:availability and limitation of liability clauses, to be drafted and reviewed by a professional}}',
          ],
        },
        {
          heading: '7. Acceptance',
          paragraphs: [
            'Acceptance of these terms is recorded on the server when the registration service is available, including the current version and the date and time in UTC. While registration is unavailable, the site does not treat the terms as accepted.',
          ],
        },
        {
          heading: '8. Changes',
          paragraphs: [
            'We may update these terms. Each version has a date identifier shown on this page. If the changes are significant, acceptance of the new version will be requested.',
          ],
        },
        {
          heading: '9. Governing law and contact',
          paragraphs: [
            'Governing law and jurisdiction: {{PENDING:governing law and competent courts}}.',
            'Contact: {{EMAIL}}.',
          ],
        },
      ],
    },
  },

  privacy: {
    es: {
      title: 'Política de privacidad',
      intro:
        'Describe qué datos trata este sitio, para qué y con qué base, cuánto tiempo se conservan y cómo ejercer tus derechos. Redactada con referencia al RGPD (Unión Europea), la CCPA (California) y la Ley 25.326 (Argentina).',
      sections: [
        {
          heading: '1. Responsable del tratamiento',
          paragraphs: [
            'Responsable: {{CONTROLLER}}. Contacto: {{EMAIL}}.',
            'Domicilio: {{PENDING:domicilio del responsable}}. Representante o delegado de protección de datos, si corresponde: {{PENDING:representante o DPO}}.',
          ],
        },
        {
          heading: '2. Datos que tratamos',
          paragraphs: ['Según la configuración técnica actual del sitio:'],
          items: [
            'Preferencias guardadas en tu navegador (tema, modo rendimiento, favoritos, perfil local, estado de la bienvenida y de las preferencias de cookies). No se envían a ningún servidor propio.',
            'Un identificador anónimo y aleatorio de visitante para los me gusta. El servidor guarda solo un valor derivado con un secreto (HMAC), nunca el identificador original.',
            'La dirección IP se usa de forma transitoria para limitar la frecuencia de solicitudes. Se guarda solo como valor derivado con un secreto, no en claro.',
            'Registro de aceptación de los términos, de la política de privacidad y de la preferencia de cookies: tipo de consentimiento, versión del documento, idioma, fecha y hora en UTC generadas por el servidor, y un valor derivado de un identificador de sesión de consentimiento. No se registran nombre, correo ni dirección IP.',
            'Reseñas de demos (si publicás una): puntuación, comentario de texto plano, idioma y fecha. Se asocian a un valor derivado (HMAC) de tu identificador anónimo, nunca al identificador original.',
            'Avisos push (si los activás): la dirección de entrega y las claves de cifrado que genera tu navegador, el modo elegido, las categorías o proyectos y el idioma. Sin nombre, correo ni IP. Darte de baja borra el registro.',
            'Cuenta opcional (si la creás): el correo solo como valor derivado con un secreto (HMAC), la contraseña solo como hash Argon2id y, si lo pedís, un respaldo de tus preferencias. La sesión usa una cookie técnica HttpOnly de una hora.',
            'Métricas de rendimiento (Web Vitals) de una muestra del 10 % de las visitas: nombre de la métrica, valor y ruta de la página. Sin cookies, sin identificadores y sin IP; no se guardan en base de datos. No se miden si tu navegador envía Do Not Track o Global Privacy Control, ni con ahorro de datos.',
            'Datos técnicos que tratan los proveedores de alojamiento y servidor para prestar el servicio (registros del servidor).',
          ],
        },
        {
          heading: '3. Finalidades',
          paragraphs: [
            'Mostrar y operar el sitio; recordar tus preferencias; contar me gusta y reseñas de forma agregada; enviar los avisos que elegiste; guardar el respaldo de tu cuenta; medir el rendimiento real del sitio; prevenir abuso y proteger el servicio; acreditar la aceptación de los términos y de la política de privacidad.',
            'Publicidad: desactivada en la actualidad. Si se activara, solo se cargaría con tu consentimiento y se describiría en esta política antes de hacerlo.',
          ],
        },
        {
          heading: '4. Bases jurídicas (RGPD)',
          paragraphs: [
            '{{PENDING:base jurídica de cada finalidad enumerada en el apartado 3, a confirmar por profesional}}',
          ],
        },
        {
          heading: '5. Destinatarios y encargados del tratamiento',
          paragraphs: ['Proveedores que prestan servicios técnicos al sitio:'],
          items: [
            'Cloudflare, Inc.: alojamiento del sitio (Cloudflare Pages) y servidores (Workers) de autenticación y de la API.',
            'GitHub, Inc.: repositorio, panel de administración y comentarios (GitHub Discussions).',
            'Supabase, Inc.: base de datos de me gusta, reseñas, suscripciones push, cuentas opcionales y registro de consentimientos.',
            'Servicios push del navegador (por ejemplo, Google, Mozilla o Apple): entregan los avisos, solo si los activás.',
            'giscus: carga de comentarios, solo cuando la solicitas.',
          ],
        },
        {
          heading: '6. Transferencias internacionales',
          paragraphs: [
            'Los proveedores pueden tratar datos fuera de tu país de residencia. {{PENDING:mecanismos de transferencia internacional aplicables (cláusulas contractuales tipo, decisiones de adecuación u otros)}}',
          ],
        },
        {
          heading: '7. Plazos de conservación',
          paragraphs: [
            'Preferencias locales: hasta que las borres desde tu navegador. Reseñas, cuenta y respaldo: hasta que pidas su eliminación. Suscripción push: hasta que te des de baja. Métricas de rendimiento: no se guardan; solo quedan en los registros del proveedor. Registro de consentimientos: {{PENDING:plazo de conservación del registro de consentimientos}}. Límites de frecuencia: se eliminan de forma periódica. {{PENDING:plazo de conservación de los registros de los proveedores de servidor}}',
          ],
        },
        {
          heading: '8. Tus derechos',
          paragraphs: ['Según la normativa que te sea aplicable:'],
          items: [
            'RGPD (Unión Europea): acceso, rectificación, supresión, limitación, oposición, portabilidad y retirada del consentimiento en cualquier momento, sin afectar la licitud del tratamiento anterior. Puedes reclamar ante la autoridad de control de tu país.',
            'CCPA (California): derecho a conocer, a eliminar tus datos personales y a no ser discriminado por ejercer tus derechos. {{PENDING:confirmar si el sitio vende o comparte datos personales en el sentido de la CCPA}}',
            'Ley 25.326 (Argentina): acceso, rectificación, actualización y supresión de tus datos. {{PENDING:confirmar la autoridad de control vigente (Agencia de Acceso a la Información Pública) y el procedimiento}}',
          ],
        },
        {
          heading: '9. Cómo ejercer tus derechos',
          paragraphs: [
            'Escribe a {{EMAIL}}. {{PENDING:canal y plazo de respuesta, a confirmar}}',
            'Solicitud de borrado o cancelación de suscripción: podés pedir la eliminación de tus datos desde el enlace «Solicitar borrado de datos / Cancelar suscripción» del pie de página. La solicitud se atiende por el canal de contacto publicado en el sitio; no se confirma ninguna eliminación hasta que el responsable la haya ejecutado.',
            'Qué puede eliminarse: tus preferencias guardadas en este navegador (que también podés borrar desde su configuración), tu registro de consentimientos, los me gusta y las reseñas asociados a tu visitante, tu suscripción push (también al darte de baja desde el panel de avisos) y tu cuenta con su respaldo. Qué podría conservarse: los registros que una obligación legal exija o que sean necesarios para acreditar un consentimiento o atender una reclamación, durante el plazo del apartado 7.',
            '{{PENDING:procedimiento automatizado de borrado en el servidor, pendiente de implementación}}',
          ],
        },
        {
          heading: '10. Cookies y almacenamiento local',
          paragraphs: [
            'El detalle de qué se almacena y cómo cambiar tus preferencias está en la política de cookies.',
          ],
        },
        {
          heading: '11. Menores',
          paragraphs: [
            'El sitio no está dirigido a menores. {{PENDING:edad mínima aplicable en cada jurisdicción}}',
          ],
        },
        {
          heading: '12. Seguridad',
          paragraphs: [
            'Aplicamos medidas técnicas: políticas de seguridad de contenido (CSP) y cabeceras de seguridad estrictas, contraseñas con Argon2id, sesión en cookie HttpOnly, Secure y SameSite=Strict, acceso a la base de datos restringido por políticas de seguridad a nivel de fila, claves de servidor que no se envían al navegador, y límites de frecuencia en los servicios de servidor. Ninguna medida es absoluta.',
          ],
        },
        {
          heading: '13. Cambios en esta política',
          paragraphs: [
            'Esta política tiene una versión con fecha visible. Los cambios relevantes se comunicarán en el sitio.',
          ],
        },
      ],
    },
    en: {
      title: 'Privacy policy',
      intro:
        'Describes which data this site processes, why and on which basis, how long it is kept, and how to exercise your rights. Drafted with reference to the GDPR (European Union), the CCPA (California) and Law 25.326 (Argentina).',
      sections: [
        {
          heading: '1. Controller',
          paragraphs: [
            'Controller: {{CONTROLLER}}. Contact: {{EMAIL}}.',
            'Address: {{PENDING:controller address}}. Representative or data protection officer, if applicable: {{PENDING:representative or DPO}}.',
          ],
        },
        {
          heading: '2. Data we process',
          paragraphs: ['Based on the current technical configuration of the site:'],
          items: [
            'Preferences stored in your browser (theme, performance mode, favorites, local profile, welcome state and cookie preferences). They are not sent to any server of ours.',
            'A random anonymous visitor identifier for likes. The server stores only a value derived with a secret (HMAC), never the original identifier.',
            'The IP address is used transiently to limit request frequency. It is stored only as a value derived with a secret, not in clear.',
            'Record of acceptance of the terms, the privacy policy and the cookie preference: type of consent, document version, language, date and time in UTC generated by the server, and a value derived from a consent session identifier. No name, email or IP address is recorded.',
            'Demo reviews (if you post one): rating, plain-text comment, language and date. They are linked to a value derived (HMAC) from your anonymous identifier, never to the original identifier.',
            'Push notifications (if you turn them on): the delivery address and encryption keys generated by your browser, the chosen mode, categories or projects, and language. No name, email or IP. Unsubscribing deletes the record.',
            'Optional account (if you create one): your email only as a value derived with a secret (HMAC), your password only as an Argon2id hash and, if you ask for it, a backup of your preferences. The session uses a one-hour technical HttpOnly cookie.',
            'Performance metrics (Web Vitals) from a 10% sample of visits: metric name, value and page path. No cookies, no identifiers and no IP; they are not stored in a database. They are not measured if your browser sends Do Not Track or Global Privacy Control, or with data saver on.',
            'Technical data processed by the hosting and server providers to deliver the service (server logs).',
          ],
        },
        {
          heading: '3. Purposes',
          paragraphs: [
            'Operating and displaying the site; remembering your preferences; counting likes and reviews in aggregate; sending the notifications you chose; storing your account backup; measuring real site performance; preventing abuse and protecting the service; evidencing acceptance of the terms and the privacy policy.',
            'Advertising: currently disabled. If enabled, it would only load with your consent, and this policy would describe it before it is activated.',
          ],
        },
        {
          heading: '4. Legal bases (GDPR)',
          paragraphs: [
            '{{PENDING:legal basis for each purpose listed in section 3, to be confirmed by a professional}}',
          ],
        },
        {
          heading: '5. Recipients and processors',
          paragraphs: ['Providers that deliver technical services to the site:'],
          items: [
            'Cloudflare, Inc.: site hosting (Cloudflare Pages) and authentication and API servers (Workers).',
            'GitHub, Inc.: repository, admin panel and comments (GitHub Discussions).',
            'Supabase, Inc.: database of likes, reviews, push subscriptions, optional accounts and consent records.',
            'Browser push services (for example Google, Mozilla or Apple): deliver notifications, only if you turn them on.',
            'giscus: comment loading, only when you request it.',
          ],
        },
        {
          heading: '6. International transfers',
          paragraphs: [
            'Providers may process data outside your country of residence. {{PENDING:applicable international transfer mechanisms (standard contractual clauses, adequacy decisions or others)}}',
          ],
        },
        {
          heading: '7. Retention periods',
          paragraphs: [
            'Local preferences: until you delete them from your browser. Reviews, account and backup: until you request their deletion. Push subscription: until you unsubscribe. Performance metrics: not stored; they only remain in the provider logs. Consent records: {{PENDING:retention period for consent records}}. Rate-limit records: removed periodically. {{PENDING:retention period for server provider logs}}',
          ],
        },
        {
          heading: '8. Your rights',
          paragraphs: ['Depending on the law applicable to you:'],
          items: [
            'GDPR (European Union): access, rectification, erasure, restriction, objection, portability and withdrawal of consent at any time, without affecting the lawfulness of prior processing. You may lodge a complaint with the supervisory authority of your country.',
            'CCPA (California): the right to know, to delete your personal information and not to be discriminated against for exercising your rights. {{PENDING:confirm whether the site sells or shares personal information within the meaning of the CCPA}}',
            'Law 25.326 (Argentina): access, rectification, updating and deletion of your data. {{PENDING:confirm the current supervisory authority (Agencia de Acceso a la Información Pública) and the procedure}}',
          ],
        },
        {
          heading: '9. How to exercise your rights',
          paragraphs: [
            'Write to {{EMAIL}}. {{PENDING:response channel and time frame, to be confirmed}}',
            'Data deletion or subscription cancellation: you can request the deletion of your data from the "Request data deletion / Cancel subscription" link in the page footer. Requests are handled through the contact channel published on the site; no deletion is confirmed until the controller has carried it out.',
            'What can be deleted: your preferences stored in this browser (you can also clear them from its settings), your consent record, the likes and reviews linked to your visitor identifier, your push subscription (also by unsubscribing from the notifications panel) and your account with its backup. What may be kept: records that a legal obligation requires or that are needed to prove a consent or handle a claim, for the period in section 7.',
            '{{PENDING:automated server-side deletion procedure, not yet implemented}}',
          ],
        },
        {
          heading: '10. Cookies and local storage',
          paragraphs: [
            'The details of what is stored and how to change your preferences are in the cookie policy.',
          ],
        },
        {
          heading: '11. Minors',
          paragraphs: [
            'The site is not directed at minors. {{PENDING:minimum age applicable in each jurisdiction}}',
          ],
        },
        {
          heading: '12. Security',
          paragraphs: [
            'We apply technical measures: content security policies (CSP) and strict security headers, Argon2id password hashing, a session cookie that is HttpOnly, Secure and SameSite=Strict, database access restricted by row-level security policies, server keys that are never sent to the browser, and rate limits on server services. No measure is absolute.',
          ],
        },
        {
          heading: '13. Changes to this policy',
          paragraphs: [
            'This policy has a visible dated version. Significant changes will be communicated on the site.',
          ],
        },
      ],
    },
  },

  cookies: {
    es: {
      title: 'Política de cookies y almacenamiento local',
      intro:
        'Este sitio no usa cookies de seguimiento. Usa almacenamiento local de tu navegador para recordar preferencias y, solo si iniciás sesión en una cuenta opcional, una cookie técnica de sesión. Aquí se describe qué se guarda y cómo cambiar tus decisiones.',
      sections: [
        {
          heading: '1. Almacenamiento que usa el sitio',
          paragraphs: [
            'Estos datos se guardan en tu navegador y no se envían al servidor del sitio:',
          ],
          items: [
            'deus:theme: tema elegido (claro u oscuro). Necesario para recordar tu elección.',
            'deus:lite-mode: modo rendimiento. Necesario para recordar tu elección.',
            'deus:favorites: lista de proyectos marcados como favoritos. Necesario para la función de favoritos.',
            'deus:likes: proyectos a los que diste me gusta desde este navegador. Necesario para mostrar tu estado.',
            'deus:visitor: identificador anónimo y aleatorio para los me gusta.',
            'deus:consent: decisiones sobre términos, privacidad y cookies, con su versión y fecha.',
            'deus:push-preferences: modo, categorías y proyectos elegidos para los avisos push.',
            'deus:intro-played (sesión): indica que la bienvenida ya se mostró en esta sesión.',
            'deus:consent-dismissed (sesión): recuerda que pospusiste el aviso de consentimiento en esta sesión.',
          ],
        },
        {
          heading: '2. Cookie técnica de sesión',
          paragraphs: [
            '__Host-deus_session: solo existe si iniciás sesión en la cuenta opcional. La crea el servidor de la API, dura una hora, es HttpOnly (el JavaScript de la página no puede leerla), Secure y SameSite=Strict, y no sirve para seguimiento. Es estrictamente necesaria para la sesión.',
          ],
        },
        {
          heading: '3. Categorías',
          paragraphs: [
            'Esenciales: tema, modo rendimiento, bienvenida y cookie de sesión. Preferencias: favoritos, me gusta, avisos push y perfil local. Publicidad: no hay publicidad activa. {{PENDING:clasificación definitiva de cada almacenamiento y si requiere consentimiento}}',
          ],
        },
        {
          heading: '4. Cookies de terceros',
          paragraphs: [
            'Comentarios: si pulsas «Cargar comentarios», se cargan recursos de giscus y de GitHub, que pueden usar sus propias cookies. Publicidad: no está activa. Si se activara, se cargaría solo con tu consentimiento.',
          ],
        },
        {
          heading: '5. Cambiar tus preferencias',
          paragraphs: [
            'Puedes cambiar tus preferencias de cookies en esta página en cualquier momento, y volver a revisar la aceptación de los términos y de la privacidad desde el mismo panel. También puedes borrar estos datos desde la configuración de tu navegador.',
          ],
        },
        {
          heading: '6. Vigencia',
          paragraphs: [
            'Esta política tiene una versión con fecha visible. {{PENDING:revisión legal de esta política}}',
          ],
        },
      ],
    },
    en: {
      title: 'Cookie and local storage policy',
      intro:
        'This site uses no tracking cookies. It uses your browser local storage to remember preferences and, only if you sign in to an optional account, a technical session cookie. This page describes what is stored and how to change your choices.',
      sections: [
        {
          heading: '1. Storage used by the site',
          paragraphs: ['This data is stored in your browser and is not sent to the site server:'],
          items: [
            'deus:theme: chosen theme (light or dark). Needed to remember your choice.',
            'deus:lite-mode: performance mode. Needed to remember your choice.',
            'deus:favorites: list of projects marked as favorites. Needed for the favorites feature.',
            'deus:likes: projects you liked from this browser. Needed to show your status.',
            'deus:visitor: random anonymous identifier used for likes.',
            'deus:consent: decisions about the terms, privacy and cookies, with their version and date.',
            'deus:push-preferences: mode, categories and projects chosen for push notifications.',
            'deus:intro-played (session): records that the welcome animation was shown in this session.',
            'deus:consent-dismissed (session): remembers that you postponed the consent notice in this session.',
          ],
        },
        {
          heading: '2. Technical session cookie',
          paragraphs: [
            '__Host-deus_session: only exists if you sign in to the optional account. It is set by the API server, lasts one hour, is HttpOnly (page JavaScript cannot read it), Secure and SameSite=Strict, and is not used for tracking. It is strictly necessary for the session.',
          ],
        },
        {
          heading: '3. Categories',
          paragraphs: [
            'Essential: theme, performance mode, welcome state and session cookie. Preferences: favorites, likes, push notifications and local profile. Advertising: no advertising is active. {{PENDING:final classification of each storage item and whether it requires consent}}',
          ],
        },
        {
          heading: '4. Third-party cookies',
          paragraphs: [
            'Comments: if you press "Load comments", resources from giscus and GitHub are loaded, which may use their own cookies. Advertising: not active. If enabled, it would only load with your consent.',
          ],
        },
        {
          heading: '5. Changing your preferences',
          paragraphs: [
            'You can change your cookie preferences on this page at any time, and review your acceptance of the terms and privacy policy from the same panel. You can also delete this data from your browser settings.',
          ],
        },
        {
          heading: '6. Validity',
          paragraphs: [
            'This policy has a visible dated version. {{PENDING:legal review of this policy}}',
          ],
        },
      ],
    },
  },
};
