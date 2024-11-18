import { useState } from 'react'
import { generateClient, get, post } from 'aws-amplify/api'
import { ConsoleLogger } from 'aws-amplify/utils'
import { Button } from '@aws-amplify/ui-react'
import { CustomTextBox } from './common/CustomTextBox'
import PlaidLink from './PlaidLink'
import { useAppDispatch, useAppSelector } from '../hooks'
import { getInvestementsAsync } from '../features/investments'
import { TouchableOpacity, View, Text } from 'react-native'

const logger = new ConsoleLogger('Refresh')

const apiName = 'plaidapi'

export default function RefreshHoldings({ item_id }: { item_id: string }) {
    const [loading, setLoading] = useState(false)
    const [loadingToken, setLoadingToken] = useState(false)
    const [token, setToken] = useState('')
    const ids = useAppSelector((state) => state.idsSlice.institutions)

    const refresh = async () => {
        ids?.map(async (id) => {
            setLoading(true)
            try {
                const { body } = await post({
                    apiName,
                    path: `/v1/items/${id.item_id}/refresh/holdings`,
                }).response
                //const data = await body.json()
                console.log('eee')
                // const { body } = await get({
                //     apiName,
                //     path: `/v1/stock/${'TSLA'}/closing-prices`,
                //     options: {
                //         body: {
                //             start_date: '2024-01-01',
                //             end_date: '2024-05-09',
                //         },
                //     },
                // }).response
                //const data = await body.json()
                //logger.debug(`POST /v1/items/${item_id}/refresh/holdings response:`, data)
                setLoading(false)
            } catch (err) {
                setLoading(false)
                logger.error('unable to refresh item', err)
            }
        })
    }

    const linkInvestment = async () => {
        setLoadingToken(true)
        try {
            const { body } = await get({
                apiName,
                path: `/v1/tokens/get_investment_token`,
            }).response
            //const data = await body.json()
            console.log('eee')
            // const { body } = await get({
            //     apiName,
            //     path: `/v1/stock/${'TSLA'}/closing-prices`,
            //     options: {
            //         body: {
            //             start_date: '2024-01-01',
            //             end_date: '2024-05-09',
            //         },
            //     },
            // }).response
            //const data = await body.json()
            //logger.debug(`POST /v1/items/${item_id}/refresh/holdings response:`, data)
            setLoadingToken(false)
            setToken(((await body.json()) as any)?.link_token)
        } catch (err) {
            setLoadingToken(false)
            logger.error('unable to refresh item', err)
        }
    }
    const client = generateClient()
    const dispatch = useAppDispatch()

    const onSuccess = () => {
        dispatch(getInvestementsAsync({ id: 'v0', client: client, append: false }))
    }

    return (
        <View className="flex flex-row">
            <TouchableOpacity
                className="bg-primary w-[40vw] text-black text-center font-medium py-2 px-4 rounded-lg shadow hover:bg-green-600 transition duration-300"
                onPress={refresh}
            >
                <Text className="text-black text-center">Refresh Holdings</Text>
            </TouchableOpacity>
            <TouchableOpacity
                className="bg-secondary w-[40vw] text-black ml-2 text-center font-medium py-2 px-4 rounded-lg shadow hover:bg-green-600 transition duration-300"
                onPress={linkInvestment}
            >
                <Text className="text-white text-center">Link Investments</Text>
            </TouchableOpacity>
            {token && <PlaidLink token={token} onSuccess={onSuccess} onExit={() => {}} />}
        </View>
    )
}
