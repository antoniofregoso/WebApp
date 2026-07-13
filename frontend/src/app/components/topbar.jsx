import { render } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import {
    icon,
    faSun,
    faMoon,
    faDesktop,
    faCircleUser,
    faBell,
    faEnvelope,
    faListCheck,
    faMagnifyingGlass,
    faChevronLeft,
    faChevronRight,
    faTableColumns,
    faList,
    faRectangleList,
    faCalendarDays,
} from './icon.js';
import { uploadAttachment } from '../api/attachments.js';
import { contextActions, dashboardActions } from '../store/actions/index.js';
import { stopActivityHeartbeat } from '../api/activity.js';
import { logout } from '../api/auth.js';
import { stopPendingCountsPolling } from '../api/pendingCounts.js';
import { fetchSystemModelByName, updateSystemModelRecord } from '../api/systemModel.js';
import { clearAuthSession, setCurrentUser } from '../store/authStore.js';
import { t } from '../../i18n/translations.js';
import { normalizePagination } from '../utils';
import { AuthenticatedImage } from './AuthenticatedImage.jsx';

const THEMES = [
    { key: 'light', icon: faSun, labelEn: 'Light', labelEs: 'Claro' },
    { key: 'dark', icon: faMoon, labelEn: 'Dark', labelEs: 'Oscuro' },
    { key: 'system', icon: faDesktop, labelEn: 'System', labelEs: 'Sistema' },
];

const VIEW_BUTTONS = [
    { key: 'kanban', icon: faTableColumns },
    { key: 'list', icon: faList },
    { key: 'form', icon: faRectangleList },
    { key: 'calendar', icon: faCalendarDays },
];

let userModelUuidPromise = null;

function normalizeBadgeCount(value) {
    const count = Math.max(0, Number(value) || 0);
    return count > 99 ? '99+' : String(count);
}

function selectAvatarFile() {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.className = 'hidden';
        input.addEventListener('change', () => {
            const file = input.files?.[0] ?? null;
            input.remove();
            resolve(file);
        }, { once: true });
        document.body.appendChild(input);
        input.click();
    });
}

async function getUserModelUuid() {
    if (!userModelUuidPromise) {
        userModelUuidPromise = fetchSystemModelByName('user.user').then((model) => model.uuid);
    }
    return userModelUuidPromise;
}

function UserAvatar({ user, class: className = '' }) {
    if (user?.avatarUrl) {
        return <AuthenticatedImage src={user.avatarUrl} alt={user?.name ?? ''} class={className} />;
    }
    return <span class={`topbar-user-avatar-fallback ${className}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: icon(faCircleUser, 'topbar-user-icon') }} />;
}

/**
 * Top navigation bar. The user menu's open/close state and its outside-click
 * / Escape listeners are wired via hooks — Preact attaches and tears them
 * down automatically on every re-render and on unmount, no manual init call
 * needed. View-switch clicks (`onViewChange`) and logout navigation
 * (`router`) stay owned by the dashboard page, since both carry routing
 * side effects beyond this component's concern.
 */
export function Topbar({ lang, theme, pageTitle, breadcrumb = [], showTools = true, pagination = {}, currentView, router, onViewChange, user = null, pendingCounts = {}, disabledViews = [] }) {
    const { page, totalPages } = normalizePagination(pagination);
    const pageStatus = lang === 'es' ? `Página ${page} de ${totalPages}` : `Page ${page} of ${totalPages}`;
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const userMenuWrapRef = useRef(null);
    const messageCount = Math.max(0, Number(pendingCounts.messages) || 0);
    const notificationCount = Math.max(0, Number(pendingCounts.notifications) || 0);
    const messageLabel = messageCount
        ? `${t('topbar.messages', lang)} (${messageCount})`
        : t('topbar.messages', lang);
    const notificationLabel = notificationCount
        ? `${t('topbar.notifications', lang)} (${notificationCount})`
        : t('topbar.notifications', lang);

    useEffect(() => {
        if (!userMenuOpen) return undefined;

        const closeOnOutsideClick = (event) => {
            if (!userMenuWrapRef.current?.contains(event.target)) {
                setUserMenuOpen(false);
            }
        };
        const closeOnEscape = (event) => {
            if (event.key === 'Escape') setUserMenuOpen(false);
        };

        document.addEventListener('click', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('click', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [userMenuOpen]);

    const handleLogout = () => {
        stopActivityHeartbeat();
        stopPendingCountsPolling();
        void logout();
        clearAuthSession();
        setUserMenuOpen(false);
        router?.goTo('login');
    };

    const handleAvatarUpload = async () => {
        if (!user?.uuid || avatarUploading) return;
        const file = await selectAvatarFile();
        if (!file) return;
        setAvatarUploading(true);
        try {
            const modelUuid = await getUserModelUuid();
            const attachment = await uploadAttachment({ modelUuid, recordUuid: user.uuid, file });
            await updateSystemModelRecord({
                model: 'user.user',
                recordUuid: user.uuid,
                values: { avatar_url: attachment.content_url },
            });
            setCurrentUser({ avatarUrl: attachment.content_url });
        } catch (error) {
            const message = error?.message ? `\n${error.message}` : '';
            window.alert(`${lang === 'es' ? 'No se pudo cambiar el avatar.' : 'Unable to change avatar.'}${message}`);
            console.error('Unable to update user avatar.', error);
        } finally {
            setAvatarUploading(false);
        }
    };

    const handleAvatarRemove = async () => {
        if (!user?.uuid || !user?.avatarUrl || avatarUploading) return;
        setAvatarUploading(true);
        try {
            await updateSystemModelRecord({
                model: 'user.user',
                recordUuid: user.uuid,
                values: { avatar_url: null },
            });
            setCurrentUser({ avatarUrl: null });
        } catch (error) {
            const message = error?.message ? `\n${error.message}` : '';
            window.alert(`${lang === 'es' ? 'No se pudo quitar el avatar.' : 'Unable to remove avatar.'}${message}`);
            console.error('Unable to remove user avatar.', error);
        } finally {
            setAvatarUploading(false);
        }
    };

    return (
        <div id="dashboard-topbar-shell" class="topbar-shell">
            <header id="dashboard-topbar" class="topbar" role="banner">
                <div class="topbar-title">
                    {breadcrumb.length ? (
                        <nav class="flex min-w-0 items-center gap-1.5 overflow-x-auto whitespace-nowrap text-[var(--dash-text)]" aria-label="Breadcrumb">
                            {breadcrumb.map((item, index) => {
                                const current = index === breadcrumb.length - 1;
                                const linked = !current && item.url && item.url !== '#';
                                return <span class="contents" key={`${item.url}:${index}`}>
                                    {index > 0 && <span class="shrink-0 text-xs text-[var(--dash-text-muted)]" aria-hidden="true">/</span>}
                                    {linked
                                        ? <a class={`${index === 0 ? 'text-[1.0625rem] font-semibold' : 'text-sm font-medium'} max-w-36 shrink-0 truncate text-[var(--dash-text-muted)] no-underline transition-colors hover:text-[var(--dash-accent)]`} href={item.url}>{item.label}</a>
                                        : <span class={`${index === 0 ? 'text-[1.0625rem] font-semibold' : 'text-sm font-medium'} max-w-36 shrink-0 truncate ${current ? 'text-[var(--dash-text)]' : 'text-[var(--dash-text-muted)]'}`} aria-current={current ? 'page' : undefined}>{item.label}</span>}
                                </span>;
                            })}
                        </nav>
                    ) : (
                        <h1 class="topbar-page-title">{pageTitle}</h1>
                    )}
                </div>

                <div class="topbar-controls" role="toolbar" aria-label="Toolbar controls">
                    <a
                        href="/dashboard/user/system.task"
                        class="topbar-action-btn"
                        aria-label={t('topbar.tasks', lang)}
                        data-tooltip={t('topbar.tasks', lang)}
                        dangerouslySetInnerHTML={{ __html: icon(faListCheck, 'topbar-action-icon') }}
                    />
                    <a href="/dashboard/user/system.message" class="topbar-action-btn" aria-label={messageLabel} data-tooltip={t('topbar.messages', lang)}>
                        <span dangerouslySetInnerHTML={{ __html: icon(faEnvelope, 'topbar-action-icon') }} />
                        {messageCount > 0 && <span class="topbar-action-badge" aria-hidden="true">{normalizeBadgeCount(messageCount)}</span>}
                    </a>
                    <button class="topbar-action-btn" aria-label={notificationLabel} data-tooltip={t('topbar.notifications', lang)}>
                        <span dangerouslySetInnerHTML={{ __html: icon(faBell, 'topbar-action-icon') }} />
                        {notificationCount > 0 && <span class="topbar-action-badge" aria-hidden="true">{normalizeBadgeCount(notificationCount)}</span>}
                    </button>

                    <div class="topbar-user-menu-wrap" ref={userMenuWrapRef}>
                        <button
                            class="topbar-user-btn"
                            aria-label="User profile"
                            aria-expanded={String(userMenuOpen)}
                            aria-controls="topbar-user-menu"
                            id="topbar-user"
                            onClick={(event) => {
                                event.stopPropagation();
                                setUserMenuOpen((open) => !open);
                            }}
                        >
                            <UserAvatar user={user} class="topbar-user-btn-avatar" />
                        </button>

                        <div class={`topbar-user-menu ${userMenuOpen ? 'topbar-user-menu--open' : ''}`} id="topbar-user-menu" role="menu" aria-labelledby="topbar-user">
                            {user && (
                                <div class="topbar-user-profile-card">
                                    <button
                                        type="button"
                                        class="topbar-user-avatar-btn"
                                        aria-label={lang === 'es' ? 'Cambiar avatar' : 'Change avatar'}
                                        onClick={handleAvatarUpload}
                                        disabled={!user?.uuid || avatarUploading}
                                    >
                                        <UserAvatar user={user} class="topbar-user-menu-avatar" />
                                        {avatarUploading && <span class="topbar-user-avatar-loading">{lang === 'es' ? 'Subiendo...' : 'Uploading...'}</span>}
                                    </button>
                                    {user?.avatarUrl && (
                                        <button
                                            type="button"
                                            class="topbar-user-avatar-remove"
                                            onClick={handleAvatarRemove}
                                            disabled={!user?.uuid || avatarUploading}
                                        >
                                            {lang === 'es' ? 'Quitar foto' : 'Remove photo'}
                                        </button>
                                    )}
                                    {user?.name && <span class="topbar-user-name">{user.name}</span>}
                                    {user?.email && <span class="topbar-user-email">{user.email}</span>}
                                </div>
                            )}

                            <div class="topbar-menu-section">
                                <span class="topbar-menu-label">{t('topbar.theme', lang)}</span>
                                <div class="topbar-theme-group" role="group" aria-label={t('topbar.theme', lang)}>
                                    {THEMES.map((th) => {
                                        const label = lang === 'es' ? th.labelEs : th.labelEn;
                                        return (
                                            <button
                                                key={th.key}
                                                class={`topbar-theme-btn ${theme === th.key ? 'topbar-theme-btn--active' : ''}`}
                                                data-theme={th.key}
                                                aria-label={label}
                                                aria-pressed={String(theme === th.key)}
                                                title={label}
                                                onClick={() => contextActions.setTheme(th.key)}
                                            >
                                                <span class="topbar-theme-icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: icon(th.icon) }} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div class="topbar-menu-section">
                                <span class="topbar-menu-label">{t('topbar.lang', lang)}</span>
                                <div class="topbar-lang-group" role="group" aria-label={t('topbar.lang', lang)}>
                                    <button
                                        class={`topbar-lang-btn ${lang === 'en' ? 'topbar-lang-btn--active' : ''}`}
                                        data-lang="en"
                                        aria-label="English"
                                        aria-pressed={String(lang === 'en')}
                                        onClick={() => contextActions.setLang('en')}
                                    >EN</button>
                                    <button
                                        class={`topbar-lang-btn ${lang === 'es' ? 'topbar-lang-btn--active' : ''}`}
                                        data-lang="es"
                                        aria-label="Español"
                                        aria-pressed={String(lang === 'es')}
                                        onClick={() => contextActions.setLang('es')}
                                    >ES</button>
                                </div>
                            </div>

                            <div class="topbar-menu-links">
                                <a class="topbar-menu-link" href="/dashboard/account" role="menuitem">{t('topbar.account', lang)}</a>
                                <a class="topbar-menu-link" href="/dashboard/settings" role="menuitem">{t('topbar.settings', lang)}</a>
                                <button class="topbar-menu-link topbar-menu-link--logout" type="button" role="menuitem" data-logout onClick={handleLogout}>
                                    {t('topbar.logout', lang)}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {showTools && (
                <div class="topbar-tools-dock">
                    <div class="topbar-floating-tools" aria-label={t('topbar.tools', lang)}>
                        <div class="topbar-view-group" role="group" aria-label={t('topbar.view_type', lang)}>
                            {VIEW_BUTTONS.map((v) => (
                                <button
                                    key={v.key}
                                    class={`topbar-tool-btn ${currentView === v.key ? 'topbar-tool-btn--active' : ''}`}
                                    data-view={v.key}
                                    aria-label={t(`topbar.view.${v.key}`, lang)}
                                    data-tooltip={t(`topbar.view.${v.key}`, lang)}
                                    disabled={disabledViews.includes(v.key)}
                                    onClick={() => onViewChange?.(v.key)}
                                    dangerouslySetInnerHTML={{ __html: icon(v.icon, 'topbar-tool-icon') }}
                                />
                            ))}
                        </div>

                        <form class="topbar-search" role="search" aria-label={t('topbar.search', lang)} onSubmit={(event) => event.preventDefault()}>
                            <input
                                class="topbar-search-input"
                                type="search"
                                placeholder={t('topbar.search_placeholder', lang)}
                                aria-label={t('topbar.search', lang)}
                            />
                            <button
                                class="topbar-search-btn"
                                type="button"
                                aria-label={t('topbar.search', lang)}
                                data-tooltip={t('topbar.search', lang)}
                                dangerouslySetInnerHTML={{ __html: icon(faMagnifyingGlass, 'topbar-tool-icon') }}
                            />
                        </form>

                        <div class="topbar-pagination" aria-label={t('topbar.pagination', lang)}>
                            <button
                                class="topbar-tool-btn"
                                data-page-previous
                                aria-label={t('topbar.page_prev', lang)}
                                data-tooltip={t('topbar.page_prev', lang)}
                                disabled={page <= 1}
                                onClick={() => dashboardActions.previousPage()}
                                dangerouslySetInnerHTML={{ __html: icon(faChevronLeft, 'topbar-tool-icon') }}
                            />
                            <span class="topbar-page-indicator" aria-label={pageStatus}>{page} / {totalPages}</span>
                            <button
                                class="topbar-tool-btn"
                                data-page-next
                                aria-label={t('topbar.page_next', lang)}
                                data-tooltip={t('topbar.page_next', lang)}
                                disabled={page >= totalPages}
                                onClick={() => dashboardActions.nextPage()}
                                dangerouslySetInnerHTML={{ __html: icon(faChevronRight, 'topbar-tool-icon') }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/** Mounts (or updates) the topbar into `container`. Safe to call repeatedly. */
export function mountTopbar(container, props) {
    if (!container) return;
    render(<Topbar {...props} />, container);
}
