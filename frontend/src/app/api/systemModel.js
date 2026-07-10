import { ClientError, gql } from 'graphql-request';

import { requestAuthenticated } from './session.js';

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
    try {
        const data = await requestAuthenticated(
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
