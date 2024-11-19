import { useState } from 'react'
import { generateClient, get, post } from 'aws-amplify/api'
import { ConsoleLogger } from 'aws-amplify/utils'
import { Button } from '@aws-amplify/ui-react'
import { CustomTextBox } from '../common/Custom/CustomTextBox'
import PlaidLink from '../Plaid/PlaidLink'
import { useAppDispatch, useAppSelector } from '../../hooks'
import { getInvestementsAsync } from '../../features/investments'
import { useParams } from 'react-router-dom'
import { callFunctionsForEachId } from './Investments'

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
    const { id } = useParams()
    const client = generateClient()
    const dispatch = useAppDispatch()

    const onSuccess = () => {
        getInvestementsAsync({ id: id || '', client: client, append: false })
    }

    return (
        <div className="flex flex-col">
            <Button className="m4" isLoading={loading} onClick={refresh} size="small">
                <CustomTextBox>Refresh Holdings</CustomTextBox>
            </Button>
            <Button className="mt-4" isLoading={loadingToken} onClick={linkInvestment} size="small">
                <CustomTextBox>Link Investments</CustomTextBox>
            </Button>
            {token && <PlaidLink token={token} onSuccess={onSuccess} onExit={() => {}} />}
        </div>
    )
}
