import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'
import { decryptItemsInBatches } from './queries/Encryption'
import { GetItems, GetUser } from './queries/Entities'
import { mapDdbResponseToItem } from './mappers/Item'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'

console.info('QUEUE URL', process.env.WEBHOOK_URL)
// Initialize the SQS client
const sqsClient = new SQSClient({ region: 'ca-central-1' }) // Replace 'your-region' with your actual AWS region
const client = new DynamoDBClient({ region: 'ca-central-1' })

export function parseUserIdAndItemId(input: string): { userId: string; itemId: string } | null {
    const regex = /^USER#([^#]+)#ITEM#([^#]+)$/

    const match = input.match(regex)
    if (!match) {
        console.error("Invalid format. Expected 'USER#<userId>#ITEM#<itemId>'.")
        return null
    }

    const [, userId, itemId] = match
    return { userId, itemId }
}

// Function to send a message to SQS
export async function updator() {
    const items = (await decryptItemsInBatches((await client.send(GetItems()))?.Items ?? [])).map(mapDdbResponseToItem)
    /** TODO: Just add created at to the item? */
    const encryptedUserItemRecord = await Promise.all(items.map(async (el) => await client.send(GetUser(el.sk || ''))))
    const decryptedUserItemRecord = (
        await decryptItemsInBatches(encryptedUserItemRecord.flatMap((output) => output.Items ?? []))
    )
        .map(mapDdbResponseToItem)
        .filter((item) => {
            console.info('Processing', item)
            return item.pk && item.created_at
        })
    const promises = decryptedUserItemRecord.flatMap(async (userItem) => {
        const { userId, itemId } = parseUserIdAndItemId(userItem.pk ?? '') ?? {}
        if (!userId || !itemId) {
            console.error('Could not parse', userItem.pk)
            return []
        }
        const params = [
            {
                QueueUrl: process.env.WEBHOOK_URL,
                DelaySeconds: 0,
                MessageAttributes: {
                    WebhookType: {
                        DataType: 'String',
                        StringValue: 'BALANCE',
                    },
                    WebhookCode: {
                        DataType: 'String',
                        StringValue: 'DEFAULT_UPDATE',
                    },
                    ItemId: {
                        DataType: 'String',
                        StringValue: itemId,
                    },
                    UserId: {
                        DataType: 'String',
                        StringValue: userId,
                    },
                },
                MessageBody: '{}', // Empty JSON body
                MessageDeduplicationId: `${userId}BALANCE_DEFAULT_UPDATE${itemId}`,
                MessageGroupId: itemId,
            },
            {
                QueueUrl: process.env.WEBHOOK_URL,
                DelaySeconds: 0,
                MessageAttributes: {
                    WebhookType: {
                        DataType: 'String',
                        StringValue: 'HOLDINGS',
                    },
                    WebhookCode: {
                        DataType: 'String',
                        StringValue: 'DEFAULT_UPDATE',
                    },
                    ItemId: {
                        DataType: 'String',
                        StringValue: itemId,
                    },
                    UserId: {
                        DataType: 'String',
                        StringValue: userId,
                    },
                },
                MessageBody: '{}', // Empty JSON body
                MessageDeduplicationId: `${userId}HOLDINGS_DEFAULT_UPDATE${itemId}`,
                MessageGroupId: itemId,
            },
        ]

        console.debug('Sending message to SQS:', params)

        try {
            const responses = params.map(async (param) => {
                const command = new SendMessageCommand(param)
                const response = await sqsClient.send(command)
                console.log('Message sent successfully:', response)
            })
            return await Promise.all(responses)
        } catch (error) {
            console.error('Failed to send message to SQS:', error)
        }
        return []
    })
    console.info(promises, 'waiting for')
    await Promise.all(promises)
}
