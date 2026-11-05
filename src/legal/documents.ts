import type { LegalLocale } from './segments';

/**
 * Contenido de los documentos legales (borrador). Describe el tratamiento técnico real del sitio.
 * Lo que requiere decisión jurídica o datos del titular se marca como {{PENDING:...}}.
 * Ningún documento afirma cumplimiento normativo ni sustituye asesoramiento profesional.
 */

export type DocumentKind = 'terms' | 'privacy' | 'cookies';

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

export const DOCUMENTS: Record<DocumentKind, Record<LegalLocale, LegalDocumentContent>> = {
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
            'Datos técnicos que tratan los proveedores de alojamiento y servidor para prestar el servicio (registros del servidor).',
          ],
        },
        {
          heading: '3. Finalidades',
          paragraphs: [
            'Mostrar y operar el sitio; recordar tus preferencias; contar me gusta de forma agregada; prevenir abuso y proteger el servicio; acreditar la aceptación de los términos y de la política de privacidad.',
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
            'GitHub, Inc.: alojamiento (GitHub Pages), panel de administración y comentarios (GitHub Discussions).',
            'Cloudflare, Inc.: servidores (Workers) de autenticación y de la API de me gusta y consentimientos.',
            'Supabase, Inc.: base de datos de me gusta agregados y registro de consentimientos.',
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
            'Preferencias locales: hasta que las borres desde tu navegador. Registro de consentimientos: {{PENDING:plazo de conservación del registro de consentimientos}}. Límites de frecuencia: se eliminan de forma periódica. {{PENDING:plazo de conservación de los registros de los proveedores de servidor}}',
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
          paragraphs: ['Escribe a {{EMAIL}}. {{PENDING:canal y plazo de respuesta, a confirmar}}'],
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
            'Aplicamos medidas técnicas: políticas de seguridad de contenido (CSP), acceso a la base de datos restringido por políticas de seguridad a nivel de fila, claves de servidor que no se envían al navegador, y límites de frecuencia en los servicios de servidor. Ninguna medida es absoluta.',
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
            'Technical data processed by the hosting and server providers to deliver the service (server logs).',
          ],
        },
        {
          heading: '3. Purposes',
          paragraphs: [
            'Operating and displaying the site; remembering your preferences; counting likes in aggregate; preventing abuse and protecting the service; evidencing acceptance of the terms and the privacy policy.',
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
            'GitHub, Inc.: hosting (GitHub Pages), admin panel and comments (GitHub Discussions).',
            'Cloudflare, Inc.: authentication and likes and consent API servers (Workers).',
            'Supabase, Inc.: database of aggregated likes and consent records.',
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
            'Local preferences: until you delete them from your browser. Consent records: {{PENDING:retention period for consent records}}. Rate-limit records: removed periodically. {{PENDING:retention period for server provider logs}}',
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
            'We apply technical measures: content security policies (CSP), database access restricted by row-level security policies, server keys that are never sent to the browser, and rate limits on server services. No measure is absolute.',
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
        'Este sitio no crea cookies propias. Usa almacenamiento local de tu navegador para recordar preferencias. Aquí se describe qué se guarda y cómo cambiar tus decisiones.',
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
            'deus:intro-played (sesión): indica que la bienvenida ya se mostró en esta sesión.',
          ],
        },
        {
          heading: '2. Categorías',
          paragraphs: [
            'Esenciales: tema, modo rendimiento y bienvenida. Preferencias: favoritos, me gusta y perfil local. Publicidad: no hay publicidad activa. {{PENDING:clasificación definitiva de cada almacenamiento y si requiere consentimiento}}',
          ],
        },
        {
          heading: '3. Cookies de terceros',
          paragraphs: [
            'Comentarios: si pulsas «Cargar comentarios», se cargan recursos de giscus y de GitHub, que pueden usar sus propias cookies. Publicidad: no está activa. Si se activara, se cargaría solo con tu consentimiento.',
          ],
        },
        {
          heading: '4. Cambiar tus preferencias',
          paragraphs: [
            'Puedes cambiar tus preferencias de cookies en esta página en cualquier momento, y volver a revisar la aceptación de los términos y de la privacidad desde el mismo panel. También puedes borrar estos datos desde la configuración de tu navegador.',
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
      title: 'Cookie and local storage policy',
      intro:
        'This site does not create its own cookies. It uses your browser local storage to remember preferences. This page describes what is stored and how to change your choices.',
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
            'deus:intro-played (session): records that the welcome animation was shown in this session.',
          ],
        },
        {
          heading: '2. Categories',
          paragraphs: [
            'Essential: theme, performance mode and welcome state. Preferences: favorites, likes and local profile. Advertising: no advertising is active. {{PENDING:final classification of each storage item and whether it requires consent}}',
          ],
        },
        {
          heading: '3. Third-party cookies',
          paragraphs: [
            'Comments: if you press "Load comments", resources from giscus and GitHub are loaded, which may use their own cookies. Advertising: not active. If enabled, it would only load with your consent.',
          ],
        },
        {
          heading: '4. Changing your preferences',
          paragraphs: [
            'You can change your cookie preferences on this page at any time, and review your acceptance of the terms and privacy policy from the same panel. You can also delete this data from your browser settings.',
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
  },
};
