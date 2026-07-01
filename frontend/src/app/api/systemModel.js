import { ClientError, gql, GraphQLClient } from 'graphql-request';
import { getAccessToken } from '../store/authStore.js';

const GRAPHQL_ENDPOINT = new URL(
    import.meta.env.VITE_GRAPHQL_ENDPOINT ?? '/graphql',
    globalThis.location?.origin ?? 'http://localhost',
).toString();

const SYSTEM_MODEL_BY_NAME_QUERY = gql`
  query SystemModelByName($name: String!) {
    systemModelByName(name: $name) {
      uuid
      name
      schemas {
        uuid
        name
        use
        view
      }
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
 * Fetches a declarative model (fields + view schemas) by its technical name,
 * e.g. "sale.order". This is the GraphQL-backed source for the dynamic views
 * documented in Doc/VIEWS_FORMAT.md.
 */
export async function fetchSystemModelByName(name, fetchImpl = globalThis.fetch) {
    const client = new GraphQLClient(GRAPHQL_ENDPOINT, {
        credentials: 'same-origin',
        fetch: fetchImpl,
        headers: () => {
            const token = getAccessToken();
            return token ? { Authorization: `Bearer ${token}` } : {};
        },
    });

    try {
        const data = await client.request(SYSTEM_MODEL_BY_NAME_QUERY, { name });
        return data.systemModelByName;
    } catch (error) {
        if (error instanceof ClientError && error.response.errors?.length) {
            throw new SystemModelError(`Model "${name}" was not found`, { cause: error });
        }
        throw new SystemModelError(`Unable to load the schema for model "${name}"`, { cause: error });
    }
}
