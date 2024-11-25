import { util } from '@aws-appsync/utils';

/**
 * Query DynamoDB for all transactions for a given user
 *USER#0cad1558-b0a1-70bd-70ae-4ff85a016c42#TRANSACTIONS
 * TRANSACTION#2024-08-31#8eDnbbplanCZ7zKgaXd8S9Q8aoXvqnHWERk6W
 * @param ctx the request context
 */
export function request(ctx) {
  const { username } = ctx.identity;
  const { limit = 20, cursor: nextToken, personalFinanceCategory,  minDate, maxDate } = ctx.arguments;
let query = {};
 if (personalFinanceCategory && minDate && maxDate) {
      query = {
        operation: 'Query',
        query: {
          expression: '#pk = :pk AND #sk BETWEEN :sk AND :sk2',
          expressionNames: {
            '#pk': 'gsi1pk',
            '#sk': 'gsi1sk',
          },
          expressionValues: util.dynamodb.toMapValues({
            ':pk': `USER#${username}#TRANSACTIONS`,
            ':sk': 'TRANSACTION#' + minDate,
            ':sk2': 'TRANSACTION#' + maxDate,
          }),
        },
        index: 'GSI1',
        scanIndexForward: false,
        limit: 4000,
        nextToken
      };
  } else {
      
   query = {
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
  const { personalFinanceCategory, personalFinanceKey } = ctx.arguments
  if (error) {
    return util.appendError(error.message, error.type, result);
  }
  
  const { items: transactions = [], nextToken: cursor } = result;
  let returnItems = transactions;
  if (personalFinanceCategory) {

    returnItems = transactions.filter((el) => personalFinanceCategory.find((el2) => {
      if (!personalFinanceKey) {
        return el2 === el.personal_finance_category["detailed"] || el2 === el.personal_finance_category["primary"]
      } else {
        return el2 === el.personal_finance_category[personalFinanceKey]
      }
    }))
  
  }
  return {
    transactions: returnItems,
    cursor,
  };
}
