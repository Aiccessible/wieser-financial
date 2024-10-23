import { AttributeValue } from 'aws-sdk/clients/dynamodb'
import { Transaction } from '../API'

// Mapper function for DynamoDB to Transaction interface
export function mapDynamoDBToTransaction(item: { [key: string]: AttributeValue }): Transaction {
    return {
        __typename: 'Transaction', // Fixed typename value
        transaction_id: item.transaction_id.S || '', // DynamoDB string type
        account_id: item.account_id?.S || null, // Nullable string
        amount: item.amount?.N || null, // Nullable string
        name: item.name?.S || null, // Nullable string
        iso_currency_code: item.iso_currency_code?.S || null, // Nullable string
        date: item.date?.S || null, // Nullable string
        payment_channel: item.payment_channel?.S || null, // Nullable string
        transaction_type: item.transaction_type?.S || null, // Nullable string
    }
}

export const mapTransactionToChatInput = (transaction: Transaction): string => {
    let chatInput = ''
    // Build the chat input string using the fields in the Transaction object
    chatInput += `(Amount: ${transaction.amount ? `$${parseFloat(transaction.amount).toFixed(2)}` : 'N/A'}\n`
    chatInput += `Name: ${transaction.name || 'N/A'}\n`
    chatInput += `Currency: ${transaction.iso_currency_code || 'N/A'}\n`
    chatInput += `Date: ${transaction.date || 'N/A'}\n`
    chatInput += `Transaction Type: ${transaction.transaction_type || 'N/A'})\n`
    return chatInput
}
