import { computed, signal } from '@preact/signals';

let accessToken = null;
let refreshToken = null;

export const authSignal = signal({
    email: null,
    isAuthenticated: false,
});

export const isAuthenticated = computed(
    () => authSignal.value.isAuthenticated,
);

export function setAuthSession({ email, token, accessToken: nextAccessToken, refreshToken: nextRefreshToken }) {
    accessToken = nextAccessToken ?? token;
    refreshToken = nextRefreshToken ?? null;
    authSignal.value = {
        email,
        isAuthenticated: Boolean(accessToken),
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
        isAuthenticated: false,
    };
}
