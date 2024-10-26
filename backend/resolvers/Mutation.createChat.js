import { util } from '@aws-appsync/utils';

/**
 * Query DynamoDB for all transactions for a given user
 *
 * @param ctx the request context
 */
export function request(ctx) {
  const { username } = ctx.identity;
  const { chat } = ctx.arguments;

  // Construct a PutItem operation for DynamoDB
  return {
    operation: 'PutItem',
    key: {
      pk: { S: chat.pk },  // Partition key with the username
      sk: { S: chat.sk },   // Sort key with the provided chat SK
    },
    attributeValues: {
      message: { S: chat.message },  // Message field
      time: { S: chat.time },        // Time field
      messageId: { S: chat.messageId },
      isLastChunk: { BOOL: chat.isLastChunk }
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
  console.log('yiooo', result)
  if (error) {
    return util.appendError(error.message, error.type, result);
  }
  console.log(result)
  
  return result;
}
