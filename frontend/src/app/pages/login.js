import { renderLogin } from '../components';
import { authenticate } from '../api/auth.js';
import { currentLang, setAuthSession } from '../store';
import { t } from '../../i18n/translations.js';

const REMEMBERED_EMAIL_KEY = 'login_email';

function getRememberedEmail() {
    return globalThis.localStorage?.getItem(REMEMBERED_EMAIL_KEY) ?? '';
}

function updateRememberedEmail(email, remember) {
    if (remember) {
        globalThis.localStorage?.setItem(REMEMBERED_EMAIL_KEY, email);
        return;
    }
    globalThis.localStorage?.removeItem(REMEMBERED_EMAIL_KEY);
}

export function login(_req, router){
    const lang = currentLang.value;
    const appEl = document.getElementById('app');
    appEl.innerHTML = renderLogin(lang);

    const form = appEl.querySelector('[data-login-form]');
    const emailInput = form.elements.email;
    const rememberInput = form.elements.remember;
    const passwordInput = form.elements.password;
    const passwordToggle = form.querySelector('[data-password-toggle]');
    const submitButton = form.querySelector('[data-login-submit]');
    const errorElement = form.querySelector('[data-login-error]');
    const submitLabel = t('auth.sign_in', lang);

    passwordToggle.addEventListener('click', () => {
        const showPassword = passwordInput.type === 'password';
        passwordInput.type = showPassword ? 'text' : 'password';
        passwordToggle.setAttribute('aria-pressed', String(showPassword));
        const label = t(
            showPassword ? 'auth.password.hide' : 'auth.password.show',
            lang,
        );
        passwordToggle.setAttribute('aria-label', label);
        passwordToggle.title = label;
        passwordToggle.querySelector('[data-password-show-icon]').hidden = showPassword;
        passwordToggle.querySelector('[data-password-hide-icon]').hidden = !showPassword;
        passwordInput.focus();
    });

    const rememberedEmail = getRememberedEmail();
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        rememberInput.checked = true;
    }

    const showError = (message) => {
        errorElement.textContent = message;
        errorElement.hidden = false;
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;

        errorElement.hidden = true;
        submitButton.disabled = true;
        submitButton.setAttribute('aria-busy', 'true');
        submitButton.textContent = t('auth.signing_in', lang);

        const email = emailInput.value.trim();
        try {
            const session = await authenticate(email, passwordInput.value);
            setAuthSession(session);
            updateRememberedEmail(email, rememberInput.checked);
            router.goTo('dash');
        } catch {
            showError(t('auth.login.error', lang));
        } finally {
            submitButton.disabled = false;
            submitButton.removeAttribute('aria-busy');
            submitButton.textContent = submitLabel;
        }
    });
}
