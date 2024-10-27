import { util } from '@aws-appsync/utils';

/**
 * Query DynamoDB for all transactions for a given user
 *
 * @param ctx the request context
 */
export function request(ctx) {
  const { username } = ctx.identity;
  const { minDate, maxDate, id, type } = ctx.arguments;

  return {
    operation: 'Query',
    query: {
      expression: '#pk = :pk AND #sk BETWEEN :minDate AND :maxDate',
      expressionNames: {
        '#pk': 'pk',
        '#sk': 'sk',
      },
      expressionValues: util.dynamodb.toMapValues({
        ':pk': `USER#${username}#ITEM#${id}#${type}`,
        ':minDate': minDate,
        ':maxDate': maxDate
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
    transactions,
    cursor,
  };
}
