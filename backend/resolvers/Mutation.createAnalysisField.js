import { util } from '@aws-appsync/utils';

/**
 * Query DynamoDB for all transactions for a given user
 *
 * @param ctx the request context
 */
export function request(ctx) {
  const { username } = ctx.identity;
  const { analysisField } = ctx.arguments;

  // Construct a PutItem operation for DynamoDB
  // TODO: fix?
  return {
    operation: 'PutItem',
    key: {
      pk: { S: 'USER#' + username + "#ANALYSISFIELD" },  // Partition key with the username
      sk: { S: analysisField.inputName },   // Sort key with the provided chat SK
    },
    attributeValues: {
      inputName: { S: analysisField.inputName },  // Message field
      inputValue: { S: analysisField.inputValue },        // Time field
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
