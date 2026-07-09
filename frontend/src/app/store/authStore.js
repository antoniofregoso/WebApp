import { computed, signal } from '@preact/signals';

let accessToken = null;
let refreshToken = null;

export const authSignal = signal({
    email: null,
    name: null,
    avatarUrl: null,
    isAuthenticated: false,
});

export const isAuthenticated = computed(
    () => authSignal.value.isAuthenticated,
);

export function setAuthSession({ email, token, accessToken: nextAccessToken, refreshToken: nextRefreshToken }) {
    accessToken = nextAccessToken ?? token;
    refreshToken = nextRefreshToken ?? null;
    authSignal.value = {
        ...authSignal.value,
        email,
        isAuthenticated: Boolean(accessToken),
    };
}

/** Merges the authenticated user's profile (from the `me` query) into the session. */
export function setCurrentUser({ name, email, avatarUrl } = {}) {
    authSignal.value = {
        ...authSignal.value,
        name: name ?? authSignal.value.name,
        email: email ?? authSignal.value.email,
        avatarUrl: avatarUrl ?? authSignal.value.avatarUrl,
    };
}

export function getAccessToken() {
    return accessToken;
}

export function getRefreshToken() {
    return refreshToken;
}

export function clearAuthSession() {
    accessToken = null;
    refreshToken = null;
    authSignal.value = {
        email: null,
        name: null,
        avatarUrl: null,
        isAuthenticated: false,
    };
}
