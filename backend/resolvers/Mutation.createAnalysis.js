import { util } from '@aws-appsync/utils';

/**
 * Query DynamoDB for all transactions for a given user
 *
 * @param ctx the request context
 */
export function request(ctx) {
  const { username } = ctx.identity;
  const { analysis } = ctx.arguments;

  // Construct a PutItem operation for DynamoDB
  // TODO: fix?
  return {
    operation: 'PutItem',
    key: {
      pk: { S: 'USER#' + username + "#ANALYSIS" },  // Partition key with the username
      sk: { S: analysis.analysisName },   // Sort key with the provided chat SK
    },
    attributeValues: {
      analysisName: { S: analysis.analysisName },  // Message field
      s3Key: { S: analysis.s3Key },        // Time field
      currentDescription: { S: analysis.currentDescription },
      currentProjection: { S: analysis.currentProjection },
      currentInputs: { L: analysis.currentInputs.map((item) => ({ S: item })) }
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
