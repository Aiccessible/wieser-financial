import { AttributeValue } from 'aws-sdk/clients/dynamodb'
import { SpendingSummary, Transaction } from '../API'

// Mapper function for DynamoDB to Transaction interface
export function mapDynamoDBToMonthlySummary(item: { [key: string]: AttributeValue }): SpendingSummary {
    return {
        __typename: 'SpendingSummary', // Fixed typename value
        spending: item.spending ? JSON.stringify({ ...item.spending?.M }) : undefined,
        sk: item.sk?.S,
    }
}

export const mapSpendingSummaryToChatInput = (summary: SpendingSummary): string => {
    let chatInput = ''
    // Build the chat input string using the fields in the Transaction object
    const spending: Record<string, { N: string }> = JSON.parse(summary?.spending ?? '{}')
    chatInput += `(Date: ${summary.sk || 'N/A'}\n`
    chatInput += 'Spending Summary:\n'
    for (const [category, amount] of Object.entries(spending)) {
        chatInput += `  - ${category}: $${amount.N}\n`
    }
    return chatInput
}
