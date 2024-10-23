import { AttributeValue } from 'aws-sdk/clients/dynamodb'
import { Account } from '../API'

// Mapper function for DynamoDB to Account interface
export function mapDynamoDBToAccount(item: { [key: string]: AttributeValue }): Account {
    return {
        __typename: 'Account', // Fixed value for __typename
        account_id: item.account_id.S || '', // DynamoDB string type
        type: item.type?.S || null, // Nullable string
        name: item.name?.S || null, // Nullable string
        subtype: item.subtype?.S || null, // Nullable string
        balances: item.balances
            ? {
                  __typename: 'Balances', // Fixed value for __typename inside balances
                  current: item.balances.M?.current?.N || null, // Handle numeric value
                  // available: item.balances.M?.available?.NULL ? null : item.balances.M?.available?.N || null, // Handle NULL or numeric value
                  // limit: item.balances.M?.limit?.NULL ? null : item.balances.M?.limit?.N || null, // Handle NULL or numeric value
                  iso_currency_code: item.balances.M?.iso_currency_code?.S || null, // Nullable string
              }
            : null,
        mask: item.mask?.S || null, // Nullable string
    }
}

export const mapAccountToChatInput = (account: Account): string => {
    let chatInput = ''

    // Append general account information
    chatInput += `Type: ${account.type || 'N/A'}\n`
    chatInput += `Name: ${account.name || 'N/A'}\n`

    // Check if balances are available and append balance information
    if (account.balances) {
        chatInput += `Current Balance: ${
            account.balances.current ? `$${parseFloat(account.balances.current).toFixed(2)}` : 'N/A'
        }\n`
        chatInput += `Currency: ${account.balances.iso_currency_code || 'N/A'}\n`
    }

    // Append mask information if available
    chatInput += `)\n`

    return chatInput
}
