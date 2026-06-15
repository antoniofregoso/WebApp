/**
 * Dashboard translations — EN / ES
 * To add a new language: add a new key to each translation object.
 */

const translations = {
    // ── Sidebar ──────────────────────────────────────────────────────────────
    'menu.area1':           { en: 'Area 1',       es: 'Área 1' },
    'menu.area2':           { en: 'Area 2',       es: 'Área 2' },
    'menu.area3':           { en: 'Area 3',       es: 'Área 3' },
    'menu.area4':           { en: 'Area 4',       es: 'Área 4' },
    'sidebar.app_name':     { en: 'Dashboard',    es: 'Dashboard' },

    // ── Topbar ───────────────────────────────────────────────────────────────
    'topbar.theme':         { en: 'Theme',         es: 'Tema' },
    'topbar.theme.light':   { en: 'Light',         es: 'Claro' },
    'topbar.theme.dark':    { en: 'Dark',          es: 'Oscuro' },
    'topbar.theme.system':  { en: 'System',        es: 'Sistema' },
    'topbar.lang':          { en: 'Language',      es: 'Idioma' },
    'topbar.account':       { en: 'Account',       es: 'Cuenta' },
    'topbar.settings':      { en: 'Settings',      es: 'Ajustes' },
    'topbar.tasks':         { en: 'Tasks',         es: 'Tareas' },
    'topbar.messages':      { en: 'Messages',      es: 'Mensajes' },
    'topbar.notifications': { en: 'Notifications', es: 'Notificaciones' },
    'topbar.tools':         { en: 'Dashboard tools', es: 'Herramientas del dashboard' },
    'topbar.view_type':     { en: 'View type',     es: 'Tipo de vista' },
    'topbar.view.kanban':   { en: 'Kanban',        es: 'Kanban' },
    'topbar.view.list':     { en: 'List',          es: 'Lista' },
    'topbar.view.form':     { en: 'Form',          es: 'Formulario' },
    'topbar.search':        { en: 'Search',        es: 'Buscar' },
    'topbar.search_placeholder': { en: 'Search...', es: 'Buscar...' },
    'topbar.pagination':    { en: 'Pagination',    es: 'Paginación' },
    'topbar.page_prev':     { en: 'Previous page', es: 'Página anterior' },
    'topbar.page_next':     { en: 'Next page',     es: 'Página siguiente' },
    'topbar.page_status':   { en: 'Page 1 of 10',  es: 'Página 1 de 10' },

    // ── Content area ─────────────────────────────────────────────────────────
    'content.area1.title':  { en: 'Area 1',       es: 'Área 1' },
    'content.area2.title':  { en: 'Area 2',       es: 'Área 2' },
    'content.area3.title':  { en: 'Area 3',       es: 'Área 3' },
    'content.area4.title':  { en: 'Area 4',       es: 'Área 4' },
    'content.welcome':      { en: 'Welcome to',   es: 'Bienvenido a' },
    'content.placeholder':  {
        en: 'This is a template. Replace this content with your own.',
        es: 'Esta es una plantilla. Reemplaza este contenido con el tuyo.'
    },
};

/**
 * Get a translated string.
 * @param {string} key   — translation key (e.g. 'menu.area1')
 * @param {string} lang  — language code: 'en' | 'es'
 * @returns {string}
 */
export function t(key, lang = 'en') {
    const entry = translations[key];
    if (!entry) {
        console.warn(`[i18n] Missing translation for key: "${key}"`);
        return key;
    }
    return entry[lang] ?? entry['en'] ?? key;
}
