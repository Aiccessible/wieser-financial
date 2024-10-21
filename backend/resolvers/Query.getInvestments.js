import { util } from '@aws-appsync/utils';

/**
 * Query DynamoDB for all transactions for a given user
 *
 * @param ctx the request context
 */
export function request(ctx) {
  const { username } = ctx.identity;
  const { id, limit = 20, cursor: nextToken } = ctx.arguments;
    // TODO: Add investment only index
  return {
    operation: 'Query',
    query: {
      expression: '#pk = :pk AND begins_with(#sk, :sk)',
      expressionNames: {
        '#pk': 'pk',
        '#sk': 'sk',
      },
      expressionValues: util.dynamodb.toMapValues({
        ':pk': `USER#${username}#ITEM#${id}`,
        ':sk': 'SECURITY#',
      }),
    },
    scanIndexForward: false,
    limit,
    nextToken,
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

  const { items: transactions = [], nextToken: cursor } = result;
  
  return {
    transactions: transactions.map((transaction) => ({
    ...transaction,
    __typename: transaction.plaid_type
    })),
    cursor,
  };
}
