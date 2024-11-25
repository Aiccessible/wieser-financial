import { useState } from 'react'
import { get, post } from 'aws-amplify/api'
import { ConsoleLogger } from 'aws-amplify/utils'
import { Button, Flex } from '@aws-amplify/ui-react'
import { useAppDispatch } from '../../hooks'
import { setPublicToken } from '../../features/auth'
import PlaidLink from '../Plaid/PlaidLink'
const apiName = 'plaidapi'
const logger = new ConsoleLogger('Plaid')

export const usePlaidHooks = ({ getItems, getPath = '/v1/tokens' }: { getItems: () => any; getPath: string }) => {
    const [connecting, setConnecting] = useState(false)
    const [token, setToken] = useState(null)

    const handleGetToken = async () => {
        setConnecting(true)
        try {
            const { body } = await get({
                apiName,
                path: getPath,
            }).response
            const data = await body.json()
            logger.debug('GET /v1/tokens response:', data)
            setToken((data as any).link_token)
            return (data as any).link_token
        } catch (err) {
            logger.error('unable to create link token:', err)
        }
    }

    const handleSuccess = async (public_token: any, metadata: any) => {
        try {
            const { body } = await post({
                apiName,
                path: '/v1/tokens',
                options: {
                    body: {
                        public_token,
                        metadata,
                    },
                },
            }).response
            const data = await body.text() // returns an 202 response code with an empty body
            logger.debug('POST /v1/tokens response:', data)
            getItems()
            setConnecting(false)
        } catch (err) {
            logger.error('unable to exchange public token', err)
        }
    }
    return { handleGetToken, handleSuccess, token, connecting, setConnecting, setToken }
}
