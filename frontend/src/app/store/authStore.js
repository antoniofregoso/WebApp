import { computed, signal } from '@preact/signals';

let accessToken = null;

export const authSignal = signal({
    email: null,
    isAuthenticated: false,
});

export const isAuthenticated = computed(
    () => authSignal.value.isAuthenticated,
);

export function setAuthSession({ email, token }) {
    accessToken = token;
    authSignal.value = {
        email,
        isAuthenticated: Boolean(token),
    };
}

export function getAccessToken() {
    return accessToken;
}

export function clearAuthSession() {
    accessToken = null;
    authSignal.value = {
        email: null,
        isAuthenticated: false,
    };
}
