import { util } from '@aws-appsync/utils';

/**
 * Query DynamoDB for all transactions for a given user
 *
 * @param ctx the request context
 */
export function request(ctx) {
  const { username } = ctx.identity;
  const { id, limit = 20, cursor: nextToken, date, personalFinanceCategory, personalFinanceKey, minDate, maxDate } = ctx.arguments;

  let query = {
    operation: 'Query',
    query: {
      expression: '#pk = :pk AND begins_with(#sk, :sk)',
      expressionNames: {
        '#pk': 'gsi1pk',
        '#sk': 'gsi1sk',
      },
      expressionValues: util.dynamodb.toMapValues({
        ':pk': `USER#${username}#TRANSACTIONS`,
        ':sk': 'TRANSACTION#',
      }),
    },
    index: 'GSI1',
    scanIndexForward: false,
    limit,
    nextToken,
  };
  if (date) {
      const filter =  {
        expression: '#date BETWEEN :minDate AND :maxDate',
        expressionNames: {
          '#date': 'date',
        },
        expressionValues: util.dynamodb.toMapValues({
          ':minDate': minDate,
          ':maxDate': maxDate,
        }),
      }
      query['filter'] = filter
  } else if (personalFinanceCategory && date && personalFinanceKey) {
      const filter =  {
        expression: '(#date BETWEEN :minDate AND :maxDate) AND (personal_finance_category.#detailed IN (:categories))',
        expressionNames: {
          '#date': 'date',
          "#detailed": personalFinanceKey 
        },
        expressionValues: util.dynamodb.toMapValues({
          ':minDate': minDate,
          ':maxDate': maxDate,
          ":categories": personalFinanceCategory
        }),
      }
      query['filter']  = filter
  }
  return query
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
