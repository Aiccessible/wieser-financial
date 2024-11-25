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
        expression: '#pk = :pk',
        expressionNames: {
          '#pk': 'pk',
          '#date': 'date',
        },
        expressionValues: util.dynamodb.toMapValues({
          ':pk': `USER#${username}#TRANSACTIONS#${type}`,
        }),
      },
      filter: {
        expression: '#date BETWEEN :minDate AND :maxDate',
        expressionNames: {
          '#date': 'date',
        },
        expressionValues: util.dynamodb.toMapValues({
          ':minDate': minDate,
          ':maxDate': maxDate,
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
  console.error(result)
  if (error) {
    return util.appendError(error.message, error.type, result);
  }

  const { items: spending = [] } = result;

  return {
    spending,
  };
}
