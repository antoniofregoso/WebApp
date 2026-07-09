import { gql, GraphQLClient } from 'graphql-request';
import { getAccessToken } from '../store/authStore.js';

const GRAPHQL_ENDPOINT = new URL(
    import.meta.env.VITE_GRAPHQL_ENDPOINT ?? '/graphql',
    globalThis.location?.origin ?? 'http://localhost',
).toString();

const ME_QUERY = gql`
  query Me {
    me {
      name
      email
      avatarUrl
    }
  }
`;

/** Fetches the authenticated user's profile (name, email, avatar) using the current session token. */
export async function fetchCurrentUser(fetchImpl = globalThis.fetch) {
    const client = new GraphQLClient(GRAPHQL_ENDPOINT, {
        credentials: 'same-origin',
        fetch: fetchImpl,
        headers: () => {
            const token = getAccessToken();
            return token ? { Authorization: `Bearer ${token}` } : {};
        },
    });

    const data = await client.request(ME_QUERY);
    return data.me;
}
