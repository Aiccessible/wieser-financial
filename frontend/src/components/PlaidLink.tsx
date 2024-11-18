import { useEffect } from 'react'
import { View } from 'react-native'
import { open, create, LinkIOSPresentationStyle, LinkLogLevel } from 'react-native-plaid-link-sdk'
export default function PlaidLinkCustom({ token, onSuccess, onExit }: any) {
    useEffect(() => {
        const asyncOpen = async () => {
            try {
                console.info('calling open')
                await open({
                    onSuccess: (e) => {
                        onSuccess(e)
                    },
                    onExit: (e) => {
                        onExit()
                    },
                    iOSPresentationStyle: LinkIOSPresentationStyle.FULL_SCREEN,
                    logLevel: LinkLogLevel.ERROR,
                })
                console.info('done')
            } catch (e) {
                console.error(e)
            }
        }
        if (token) {
            console.info('Opening token', token)
            create({ token: token, noLoadingState: false })
            asyncOpen()
        }
    }, [token, open])
    return <View />
}
