import { ClientError, gql, GraphQLClient } from 'graphql-request';
import { refreshSession } from './auth.js';
import {
    clearAuthSession,
    getAccessToken,
    getRefreshToken,
    setAuthSession,
} from '../store/authStore.js';

const GRAPHQL_ENDPOINT = new URL(
    import.meta.env.VITE_GRAPHQL_ENDPOINT ?? '/graphql',
    globalThis.location?.origin ?? 'http://localhost',
).toString();

const SYSTEM_MODEL_VIEW_QUERY = gql`
  query SystemModelView($model: String!, $use: SystemModelSchemaUse!, $name: String!) {
    systemModelView(model: $model, use: $use, name: $name) {
      model
      records
    }
  }
`;

export class SystemModelError extends Error {
    constructor(message, options) {
        super(message, options);
        this.name = 'SystemModelError';
    }
}

function isAuthenticationError(error) {
    if (!(error instanceof ClientError)) return false;
    const status = error.response.status;
    if (status === 401) return true;
    return error.response.errors?.some(({ message = '', extensions = {} }) => (
        extensions.error_code === 'AUTHENTICATION_ERROR'
        || /not authenticated|unauthenticated|token expired|invalid token/i.test(message)
    )) ?? false;
}

async function refreshAuthSession(fetchImpl) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
        const session = await refreshSession(refreshToken, fetchImpl);
        setAuthSession(session);
        return true;
    } catch (error) {
        clearAuthSession();
        return false;
    }
}

async function requestWithSessionRefresh(client, query, variables, fetchImpl) {
    try {
        return await client.request(query, variables);
    } catch (error) {
        if (!isAuthenticationError(error) || !await refreshAuthSession(fetchImpl)) {
            throw error;
        }
        return client.request(query, variables);
    }
}

/**
 * Fetches the declarative view payload for a model, including metadata,
 * schema, and records.
 */
export async function fetchSystemModelView(
    { model, use = 'view', name = 'default' },
    fetchImpl = globalThis.fetch,
) {
    const client = new GraphQLClient(GRAPHQL_ENDPOINT, {
        credentials: 'same-origin',
        fetch: fetchImpl,
        headers: () => {
            const token = getAccessToken();
            return token ? { Authorization: `Bearer ${token}` } : {};
        },
    });

    try {
        const data = await requestWithSessionRefresh(
            client,
            SYSTEM_MODEL_VIEW_QUERY,
            { model, use, name },
            fetchImpl,
        );
        return data.systemModelView;
    } catch (error) {
        if (error instanceof ClientError && error.response.errors?.length) {
            throw new SystemModelError(`View "${model}/${use}/${name}" was not found`, { cause: error });
        }
        throw new SystemModelError(`Unable to load the view for model "${model}"`, { cause: error });
    }
}
