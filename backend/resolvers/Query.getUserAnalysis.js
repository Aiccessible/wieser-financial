import { util } from '@aws-appsync/utils';

/**
 * Query DynamoDB for all transactions for a given user
 *
 * @param ctx the request context
 */
export function request(ctx) {
  const { username } = ctx.identity;
    // TODO: Add investment only index
  return {
    operation: 'Query',
    query: {
      expression: '#pk = :pk',
      expressionNames: {
        '#pk': 'pk',
      },
      expressionValues: util.dynamodb.toMapValues({
        ':pk': `USER#${username}#ANALYSIS`,
      }),
    },
    scanIndexForward: false,
  };
}

/**
 * Returns the DynamoDB result
 *
 * @param ctx the request context
 */
export function response(ctx) {
  const { error, result } = ctx;
  if (error) {
    return util.appendError(error.message, error.type, result);
  }

  const { items = [] } = result;

  return items;
}
