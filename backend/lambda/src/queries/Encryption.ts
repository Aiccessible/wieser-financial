import { QueryCommandOutput } from '@aws-sdk/client-dynamodb'
import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms'

const kmsClient = new KMSClient({ region: 'ca-central-1' })

const KEY_ARN = process.env.KEY_ARN

async function encryptData(data: string): Promise<string> {
    const command = new EncryptCommand({
        KeyId: KEY_ARN,
        Plaintext: Buffer.from(data),
    })

    const response = await kmsClient.send(command)
    return response.CiphertextBlob?.toString() || ''
}

async function decryptData(encryptedData: string): Promise<string> {
    const command = new DecryptCommand({
        CiphertextBlob: Buffer.from(encryptedData, 'base64'),
    })

    const response = await kmsClient.send(command)
    return response.Plaintext?.toString() || ''
}

export async function decryptItemsInBatches(items: Record<string, any>[]) {
    if (true) {
        return items
    }
    const decryptedItems: Record<string, any>[] = []

    // Split items into batches of 100
    for (let i = 0; i < items.length; i += 100) {
        const batch = items.slice(i, i + 100)

        // Decrypt each item in the batch concurrently
        const decryptedBatch = await Promise.all(
            batch.map(async (item) => {
                const decryptedItem: Record<string, any> = {}

                for (const [key, value] of Object.entries(item)) {
                    if (key === 'pk' || key === 'sk') {
                        decryptedItem[key] = value
                        continue
                    }
                    if (value && value.S) {
                        // Decrypt string attributes
                        decryptedItem[key] = await decryptData(value.S)
                    } else if (value && value.N) {
                        // Keep numbers as they are
                        decryptedItem[key] = value.N
                    } else if (value && value.B) {
                        // Decrypt binary attributes
                        const decryptedValue = await decryptData(value.B.toString('base64'))
                        decryptedItem[key] = Buffer.from(decryptedValue, 'base64')
                    } else if (value && value.BOOL !== undefined) {
                        decryptedItem[key] = value.BOOL
                    } else if (value && value.NULL !== undefined) {
                        decryptedItem[key] = null
                    } else if (value && value.L) {
                        // Handle lists by recursively decrypting each element
                        decryptedItem[key] = await Promise.all(
                            value.L.map(async (item: any) => await decryptData(item))
                        )
                    } else if (value && value.M) {
                        // Handle maps by recursively decrypting each attribute in the map
                        const decryptedMap: Record<string, any> = {}
                        for (const [mapKey, mapValue] of Object.entries(value.M)) {
                            decryptedMap[mapKey] = await decryptData(mapValue as string)
                        }
                        decryptedItem[key] = decryptedMap
                    } else {
                        // If attribute type is unrecognized, return as-is
                        decryptedItem[key] = value
                    }
                }

                return decryptedItem
            })
        )

        // Add the decrypted batch to the final list of decrypted items
        decryptedItems.push(...decryptedBatch)
    }

    return decryptedItems
}
