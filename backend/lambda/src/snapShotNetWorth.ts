import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { GetEntities, GetItems, GetUser } from './queries/Entities'
import { decryptItemsInBatches } from './queries/Encryption'
import { mapDdbResponseToItem } from './mappers/Item'
import { Account, Holding, Item, Security } from './API'
import { mapSecuritiesToJoinedData } from './mappers/Security'
import { mapDynamoDBToAccount } from './mappers/Accounts'

const client = new DynamoDBClient({ region: 'ca-central-1' })

function getEarliestFirstOfMonthWithin90Days(createdAt: Date) {
    return new Date(new Date().getTime() - 1000 * 3600 * 24 * 365)
}

export const snapShotNetWorth = async () => {
    // TODO: Add logic to handle last calculated complete month and start from then
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
    /** Go through users and aggregate transactions */
    await processUsersInBatches(decryptedUserItemRecord)
}

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
}

async function processUsersInBatches(decryptedUserItemRecord: Item[]) {
    const userBatches = chunkArray(decryptedUserItemRecord, 100)
    const now = new Date() // Get the current date and time

    for (const batch of userBatches) {
        await Promise.all(
            batch.map(async (item) => {
                const startDay = getEarliestFirstOfMonthWithin90Days(new Date(item?.created_at ?? 0))
                console.info(startDay)
                const encryptedTransactions = await client.send(
                    GetEntities({
                        pk: item.pk ?? '',
                        dateRange: {
                            hasNoTimeConstraint: true,
                        } as any,
                        username: '',
                        id: '',
                        entityName: 'SECURITY',
                    })
                )

                const decrypedSecurities = await mapSecuritiesToJoinedData(
                    await decryptItemsInBatches(encryptedTransactions.Items ?? [])
                )
                const encryptedAccounts = await client.send(
                    GetEntities({
                        pk: item.pk ?? '',
                        dateRange: {
                            hasNoTimeConstraint: true,
                        } as any,
                        username: '',
                        id: '',
                        entityName: 'ACCOUNT',
                    })
                )

                const decrypedAccounts = encryptedAccounts.Items?.map(mapDynamoDBToAccount) ?? []
                const netWorth = reduceAccounts(decrypedAccounts)
                const securitySnapshot = Object.values(decrypedSecurities)
                const securityNetWorth = getNetWorth(securitySnapshot)
                const tfsaNetWorth = reduceAccounts(
                    decrypedAccounts.filter((acc) => checkAccountNameOrTypes(['tfsa'], acc))
                )
                const rrspNetWorth = reduceAccounts(
                    decrypedAccounts.filter((acc) => checkAccountNameOrTypes(['rrsp', 'drsp'], acc))
                )
                const fhsaNetWorth = reduceAccounts(
                    decrypedAccounts.filter((acc) => checkAccountNameOrTypes(['fhsa'], acc))
                )
                const command = new PutItemCommand({
                    TableName: process.env.TABLE_NAME,
                    Item: {
                        pk: { S: item.pk ? item.pk + '#NETWORTHDAILYSNAPSHOT' : '' },
                        sk: { S: new Date().toDateString() },
                        netWorth: { N: netWorth.toFixed(2) },
                        tfsaNetWorth: { N: tfsaNetWorth.toFixed(2) },
                        rrspNetWorth: { N: rrspNetWorth.toFixed(2) },
                        fhsaNetWorth: { N: fhsaNetWorth.toFixed(2) },
                        securityNetWorth: { N: securityNetWorth.toFixed(2) },
                    },
                })
                return client.send(command)
            })
        )
    }
}

const checkAccountNameOrTypes = (types: string[], acc: Account) => {
    return types
        .map((type) => {
            return acc.name?.toLowerCase()?.includes(type) || acc.type?.toLowerCase().includes(type)
        })
        .includes(true)
}

export const getAccountBalanceMultipler = (acc: Account) => (acc.type === 'loan' || acc.type === 'credit' ? -1 : 1)

export const reduceAccounts = (accs: Account[]) =>
    accs.reduce(
        (val: number, acc) => val + getAccountBalanceMultipler(acc) * parseFloat(acc.balances?.current || '0'),
        0
    )

export const getNetWorth = (holdings: { security: Security | undefined; holding: Holding }[]) => {
    return holdings.reduce((val, holding) => {
        return val + (holding.holding.quantity ?? 0) * (holding.security?.close_price ?? 0)
    }, 0)
}
