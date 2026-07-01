
import { t } from '../../i18n/translations.js';
import { faEye, faEyeSlash, icon } from './icon.js';

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

            <form class="login-form" data-login-form>
                <label class="login-field">
                    <span>${t('auth.email', lang)}</span>
                    <input type="email" name="email" placeholder="${t('auth.email.placeholder', lang)}"
                        autocomplete="email" required />
                </label>

                <div class="login-field">
                    <label for="login-password">${t('auth.password', lang)}</label>
                    <div class="login-password-control">
                        <input id="login-password" type="password" name="password"
                            placeholder="••••••••" autocomplete="current-password"
                            required minlength="8" />
                        <button class="login-password-toggle" type="button"
                            data-password-toggle aria-controls="login-password"
                            aria-label="${t('auth.password.show', lang)}"
                            aria-pressed="false" title="${t('auth.password.show', lang)}">
                            <span data-password-show-icon>${icon(faEye)}</span>
                            <span data-password-hide-icon hidden>${icon(faEyeSlash)}</span>
                        </button>
                    </div>
                </div>

                <div class="login-row">
                    <label class="login-check">
                        <input type="checkbox" name="remember" />
                        <span>${t('auth.remember', lang)}</span>
                    </label>
                    <a href="/password_reset" class="login-link">${t('auth.forgot_password', lang)}</a>
                </div>

                <p class="login-error" data-login-error role="alert" hidden></p>

                <button class="login-submit" type="submit" data-login-submit>
                    ${t('auth.sign_in', lang)}
                </button>
            </form>
        </section>
    </main>
    `;
}
