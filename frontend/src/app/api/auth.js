import { ClientError, gql, GraphQLClient } from 'graphql-request';

const GRAPHQL_ENDPOINT = new URL(
    import.meta.env.VITE_GRAPHQL_ENDPOINT ?? '/graphql',
    globalThis.location?.origin ?? 'http://localhost',
).toString();

const LOGIN_MUTATION = gql`
  mutation Login($login: LoginInput!) {
    login(login: $login) {
      email
      token
    }
  }
`;

export class AuthenticationError extends Error {
    constructor(message, code = 'AUTHENTICATION_FAILED', options) {
        super(message, options);
        this.name = 'AuthenticationError';
        this.code = code;
    }
}

export async function authenticate(email, password, fetchImpl = globalThis.fetch) {
    const client = new GraphQLClient(GRAPHQL_ENDPOINT, {
        credentials: 'same-origin',
        fetch: fetchImpl,
    });

    try {
        const data = await client.request(LOGIN_MUTATION, {
            login: { email, password },
        });

        if (!data.login?.token) {
            throw new AuthenticationError('Invalid email or password');
        }

        return data.login;
    } catch (error) {
        if (error instanceof AuthenticationError) throw error;
        if (error instanceof ClientError && error.response.errors?.length) {
            throw new AuthenticationError('Invalid email or password');
        }
        throw new AuthenticationError(
            'Unable to reach the authentication service',
            'NETWORK_ERROR',
            { cause: error },
        );
    }
}
