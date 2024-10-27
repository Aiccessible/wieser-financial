import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { AggregatedSpending, DailySpendingSummary } from '../calculateIncomeAndSpending'

// Define DynamoDB client
const client = new DynamoDBClient({ region: 'ca-central-1' })

// Function to upload results to DynamoDB
export async function uploadSpendingSummaries(
    userId: string,
    dailySummaries: DailySpendingSummary[],
    monthlySummaries: { [monthYear: string]: AggregatedSpending }
) {
    // Upload daily summaries
    for (const dailySummary of dailySummaries) {
        const pk = `${userId}#DAILYSUMMARY`
        const sk = `${dailySummary.date}` // `date` format is expected as YYYY-MM-DD

        const command = new PutItemCommand({
            TableName: process.env.TABLE_NAME,
            Item: {
                pk: { S: pk },
                sk: { S: sk },
                spending: {
                    M: Object.entries(dailySummary.spending).reduce((acc, [category, amount]) => {
                        acc[category] = { N: amount.toFixed(2) } // Convert spending amounts to strings for DDB
                        return acc
                    }, {} as Record<string, { N: string }>),
                },
            },
        })

        try {
            await client.send(command)
            console.log(`Uploaded daily summary for ${dailySummary.date}`)
        } catch (error) {
            console.error(`Error uploading daily summary for ${dailySummary.date}:`, error)
        }
    }

    // Upload monthly summaries
    for (const [monthYear, monthlySummary] of Object.entries(monthlySummaries)) {
        const pk = `${userId}#MONTHLYSUMMARY`
        const sk = `${monthYear}` // Format: YEARMONTH (e.g., 202401 for January 2024)

        const command = new PutItemCommand({
            TableName: process.env.TABLE_NAME,
            Item: {
                pk: { S: pk },
                sk: { S: sk },
                spending: {
                    M: Object.entries(monthlySummary.monthly_spending).reduce((acc, [category, amount]) => {
                        acc[category] = { N: amount.toFixed(2) }
                        return acc
                    }, {} as Record<string, { N: string }>),
                },
            },
        })

        try {
            await client.send(command)
            console.log(`Uploaded monthly summary for ${monthYear}`)
        } catch (error) {
            console.error(`Error uploading monthly summary for ${monthYear}:`, error)
        }
    }
}
