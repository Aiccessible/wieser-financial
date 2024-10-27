import { AttributeValue } from 'aws-sdk/clients/dynamodb'
import { Holding, Security } from '../API'
import { mapDynamoDBToInvestmentHolding } from './InvestmentHoldings'
import { decryptItemsInBatches } from '../queries/Encryption'

// Mapper function for DynamoDB to SecurityDetails interface
export function mapDynamoDBToSecurityDetails(item: { [key: string]: AttributeValue }): Security {
    return {
        close_price: parseFloat(item.close_price?.N || ''), // DynamoDB number type
        close_price_as_of: item.close_price_as_of?.S || null, // Nullable string
        cusip: item.cusip?.S || '',
        institution_id: item.institution_id?.S || null, // Nullable string
        institution_security_id: item.institution_security_id?.S || null, // Nullable string
        is_cash_equivalent: item.is_cash_equivalent?.BOOL || false, // Boolean type
        isin: item.isin?.S || '',
        iso_currency_code: item.iso_currency_code?.S || '',
        name: item.name?.S || '',
        proxy_security_id: item.proxy_security_id?.S || null, // Nullable string
        security_id: item.security_id?.S || '',
        sedol: item.sedol?.S || null, // Nullable string
        ticker_symbol: item.ticker_symbol?.S || '',
        type: item.type?.S || '',
        unofficial_currency_code: item.unofficial_currency_code?.S || null, // Nullable string
        market_identifier_code: item.market_identifier_code?.S || '',
        option_contract: item.option_contract?.S || null, // Nullable string
        plaid_type: item.plaid_type?.S ?? '',
        __typename: 'Security',
    }
}
type JoinedSecurityData = Record<string, { security: Security | undefined; holding: Holding }>
export async function mapSecuritiesToJoinedData(
    items: { [key: string]: AttributeValue }[]
): Promise<JoinedSecurityData> {
    const decryptedItems = await decryptItemsInBatches(items)
    const mappedItems = decryptedItems.map((item) => {
        if (item.plaid_type?.S === 'Security') {
            return mapDynamoDBToSecurityDetails(item)
        } else if (item.plaid_type?.S === 'Holding') {
            return mapDynamoDBToInvestmentHolding(item)
        } else {
            throw new Error('Unsupported type')
        }
    })
    return mapHoldingsAndSecuritiesToJointData(mappedItems)
}

export const mapJointDataToChatInput = (jointData: JoinedSecurityData): string => {
    const chatInputs: string[] = []
    // Iterate over the values in the `jointData` object
    Object.values(jointData).forEach(({ security, holding }) => {
        let chatInput = '('

        if (security) {
            // Process security fields into a chat message
            chatInput += `Security Name: ${security.name || 'N/A'}\n`
            chatInput += `Ticker Symbol: ${security.ticker_symbol || 'N/A'}\n`
            chatInput += `Close Price: ${security.close_price ? `$${security.close_price.toFixed(2)}` : 'N/A'}\n`
            chatInput += `Close Price As Of: ${security.close_price_as_of || 'N/A'}\n`
            chatInput += `Sector: ${security.sector || 'N/A'}\n`
            chatInput += `Industry: ${security.industry || 'N/A'}\n`
        }

        if (holding) {
            // Process holding fields into the same message
            chatInput += `Quantity: ${holding.quantity || 'N/A'}\n`
            chatInput += `Cost Basis: ${holding.cost_basis ? `$${holding.cost_basis.toFixed(2)}` : 'N/A'}\n`
            chatInput += `Institution Value: ${
                holding.institution_value ? `$${holding.institution_value.toFixed(2)}` : 'N/A'
            }\n`
            chatInput += `Institution Price: ${
                holding.institution_price ? `$${holding.institution_price.toFixed(2)}` : 'N/A'
            }\n`
            chatInput += `Institution Price As Of: ${holding.institution_price_as_of || 'N/A'}`
        }
        chatInput += ')\n'
        chatInputs.push(chatInput)
    })
    return chatInputs.join('')
}

export const mapHoldingsAndSecuritiesToJointData = (holdings: (Holding | Security)[]) => {
    const getId = (el: Holding | Security) => el.account_id + '-' + el.security_id
    const accountAndsecurityIdToEntity: JoinedSecurityData = {}
    const investments = [...holdings]
    investments?.forEach((el) => {
        if (el.plaid_type === 'Holding') {
            accountAndsecurityIdToEntity[getId(el)] = {
                security: investments?.find(
                    (sec) => sec.plaid_type === 'Security' && sec.security_id === el.security_id
                ) as Security | undefined,
                holding: el as Holding,
            }
        }
    })
    return accountAndsecurityIdToEntity
}
