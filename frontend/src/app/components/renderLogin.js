
import { t } from '../../i18n/translations.js';

export function renderLogin(lang = 'en') {
    return `
    <main class="app-shell login-page">
        <section class="login-panel" aria-label="${t('auth.login.aria', lang)}">
            <div class="login-brand">
                <img class="login-logo" src="/logo.png" alt="WebApp logo" />
                <span class="login-brand-name">WebApp</span>
            </div>

            <div class="login-copy">
                <p class="login-eyebrow">${t('auth.login.eyebrow', lang)}</p>
                <h1 class="login-title">${t('auth.login.title', lang)}</h1>
                <p class="login-subtitle">${t('auth.login.subtitle', lang)}</p>
            </div>

            <form class="login-form" action="#">
                <label class="login-field">
                    <span>${t('auth.email', lang)}</span>
                    <input type="email" name="email" placeholder="${t('auth.email.placeholder', lang)}" autocomplete="email" />
                </label>

                <label class="login-field">
                    <span>${t('auth.password', lang)}</span>
                    <input type="password" name="password" placeholder="••••••••" autocomplete="current-password" />
                </label>

                <div class="login-row">
                    <label class="login-check">
                        <input type="checkbox" name="remember" />
                        <span>${t('auth.remember', lang)}</span>
                    </label>
                    <a href="/password_reset" class="login-link">${t('auth.forgot_password', lang)}</a>
                </div>

                <button class="login-submit" type="button">${t('auth.sign_in', lang)}</button>
            </form>
        </section>
    </main>
    `;
}
