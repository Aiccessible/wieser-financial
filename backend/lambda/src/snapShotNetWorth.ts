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
    const recordsWithGroupKey = decryptedUserItemRecord.map((el) => ({
        ...el,
        groupKey: el.pk?.replace(/#ITEM#\w+/, ''),
    }))
    const groupedByGroupKey = recordsWithGroupKey.reduce<Record<string, Item[]>>((acc, item) => {
        const key = item.groupKey || 'undefined'
        if (!acc[key]) {
            acc[key] = []
        }
        acc[key].push(item)
        return acc
    }, {})

    // Step 3: Get an array of groups (each group is an array of items with the same groupKey)
    const groupedArrays = Object.values(groupedByGroupKey)

    // Step 4: Chunk the groups into batches of 100
    const groupBatches = chunkArray(groupedArrays, 100)

    // Step 5: Process each batch of 100 groups
    for (const batch of groupBatches) {
        for (const items of batch) {
            try {
                let encryptedTransactions = []
                for (let i = 0; i < items.length; i++) {
                    console.info('Sending', items[i])
                    const res = await client.send(
                        GetEntities({
                            pk: items[i].pk?.replace(/#ITEM#\w+/, '') ?? '',
                            dateRange: {
                                hasNoTimeConstraint: true,
                            } as any,
                            username: '',
                            id: '',
                            entityName: 'SECURITY',
                            getAllSecuritiesForUser: true,
                        })
                    )
                    encryptedTransactions.push(...(res?.Items ?? []))
                }

                const decrypedSecurities = await mapSecuritiesToJoinedData(
                    await decryptItemsInBatches(encryptedTransactions ?? [])
                )
                const encryptedAccounts = await Promise.all(
                    items.flatMap(
                        async (item) =>
                            await client.send(
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
                    )
                )

                const decrypedAccounts = encryptedAccounts.flatMap((el) => el.Items?.map(mapDynamoDBToAccount) ?? [])
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
                const accountsToBalances: Record<string, { N: string }> = {}
                decrypedAccounts.forEach((acc) => {
                    accountsToBalances[acc.account_id] = { N: reduceAccounts([acc]).toFixed(2) }
                })
                const command = new PutItemCommand({
                    TableName: process.env.TABLE_NAME,
                    Item: {
                        pk: {
                            S: (items[0] as any)?.groupKey
                                ? (items[0] as any)?.groupKey + '#NETWORTHDAILYSNAPSHOT'
                                : '',
                        },
                        sk: { S: new Date().toISOString() },
                        netWorth: { N: netWorth.toFixed(2) },
                        tfsaNetWorth: { N: tfsaNetWorth.toFixed(2) },
                        rrspNetWorth: { N: rrspNetWorth.toFixed(2) },
                        fhsaNetWorth: { N: fhsaNetWorth.toFixed(2) },
                        securityNetWorth: { N: securityNetWorth.toFixed(2) },
                        securities: { S: JSON.stringify(securitySnapshot) },
                        balances: { S: JSON.stringify(accountsToBalances) },
                    },
                })
                await client.send(command)
            } catch (e) {
                console.error(e)
                return undefined
            }
        }
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
