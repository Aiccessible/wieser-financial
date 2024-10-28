import { useState } from 'react'
import { get, post } from 'aws-amplify/api'
import { ConsoleLogger } from 'aws-amplify/utils'
import { Button } from '@aws-amplify/ui-react'
import { CustomTextBox } from './common/CustomTextBox'

const logger = new ConsoleLogger('Refresh')

const apiName = 'plaidapi'

export default function RefreshHoldings({ item_id }: { item_id: string }) {
    const [loading, setLoading] = useState(false)

    const refresh = async () => {
        setLoading(true)
        try {
            const { body } = await post({
                apiName,
                path: `/v1/items/${item_id}/refresh/holdings`,
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
    }

    return (
        <Button isLoading={loading} onClick={refresh} size="small">
            <CustomTextBox>Refresh Holdings</CustomTextBox>
        </Button>
    )
}
