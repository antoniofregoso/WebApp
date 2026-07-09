import { ClientError, gql, GraphQLClient } from 'graphql-request';
import { getAccessToken } from '../store/authStore.js';

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
        const data = await client.request(SYSTEM_MODEL_VIEW_QUERY, { model, use, name });
        return data.systemModelView;
    } catch (error) {
        if (error instanceof ClientError && error.response.errors?.length) {
            throw new SystemModelError(`View "${model}/${use}/${name}" was not found`, { cause: error });
        }
        throw new SystemModelError(`Unable to load the view for model "${model}"`, { cause: error });
    }
}
