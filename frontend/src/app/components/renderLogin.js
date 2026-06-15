
export function renderLogin(lang) {
    return `
    <main class="app-shell login-page">
        <section class="login-panel" aria-label="Login">
            <div class="login-brand">
                <img class="login-logo" src="/logo.png" alt="WebApp logo" />
                <span class="login-brand-name">WebApp</span>
            </div>

            <div class="login-copy">
                <p class="login-eyebrow">Template workspace</p>
                <h1 class="login-title">Sign in to your app</h1>
                <p class="login-subtitle">A clean starting point to generate modern web applications.</p>
            </div>

            <form class="login-form" action="#">
                <label class="login-field">
                    <span>Email</span>
                    <input type="email" name="email" placeholder="name@company.com" autocomplete="email" />
                </label>

                <label class="login-field">
                    <span>Password</span>
                    <input type="password" name="password" placeholder="••••••••" autocomplete="current-password" />
                </label>

                <div class="login-row">
                    <label class="login-check">
                        <input type="checkbox" name="remember" />
                        <span>Remember me</span>
                    </label>
                    <a href="#" class="login-link">Forgot password?</a>
                </div>

                <button class="login-submit" type="button">Sign in</button>
            </form>
        </section>
    </main>
    `;
}
