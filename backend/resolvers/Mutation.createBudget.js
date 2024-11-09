import { util } from '@aws-appsync/utils';

/**
 * Query DynamoDB for all transactions for a given user
 *
 * @param ctx the request context
 */
export function request(ctx) {
  const { username } = ctx.identity;
  const { budget } = ctx.arguments;

  // Construct a PutItem operation for DynamoDB
  // TODO: fix?
  return {
    operation: 'PutItem',
    key: {
      pk: { S: 'USER#' + username + "#BUDGETPLAN" },  // Partition key with the username
      sk: { S: budget.highLevelCategory + '#' + budget.sk },   // Sort key with the provided chat SK
    },
    attributeValues: {
      highLevelCategory: { S: budget.highLevelCategory },  // Message field
      timeframe: { S: budget.timeframe },        // Time field
      spendingThreshold: { N: budget.spendingThreshold },
      createdAt: { S: budget.createdAt },
      recommendationTitle: { S: budget.recommendationTitle }
    },
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
  console.log(result)
  
  return result;
}
