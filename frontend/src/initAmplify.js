import { Amplify } from 'aws-amplify'
import { ConsoleLogger } from 'aws-amplify/utils'
import { fetchAuthSession } from 'aws-amplify/auth'

import '@aws-amplify/ui-react/styles.css'

import { View, Button } from 'react-native'

global.div = View
global.button = Button

/** BETA */
const REACT_APP_BACKEND_URL=`https://m0e7h64wud.execute-api.ca-central-1.amazonaws.com`
const REACT_APP_COGNITO_CLIENT_ID=`34kefidu2j4cbl7otehoefdv0b`
const REACT_APP_COGNITO_DOMAIN = `fcbc78a0-94bb-11ef-ae9c-02f264ebaca7.auth.ca-central-1.amazoncognito.com`
const REACT_APP_COGNTIO_USERPOOL_ID=`ca-central-1_iPR6fTfvC`
const REACT_APP_GRAPHQL_URL=`https://zggfvkdmzrctjcriaq54oy6tlm.appsync-api.ca-central-1.amazonaws.com/graphql`
const REACT_APP_REGION=`ca-central-1`
ConsoleLogger.LOG_LEVEL = 'DEBUG'

/** PRODUCTION */
// const REACT_APP_BACKEND_URL = `https://32a9hu200c.execute-api.ca-central-1.amazonaws.com`
// const REACT_APP_COGNITO_CLIENT_ID = `5diuvc6qk7ej184219fcoa1cra`
// const REACT_APP_COGNITO_DOMAIN = `dac68ad0-95c7-11ef-82b4-0e2dd79a96b5.auth.ca-central-1.amazoncognito.com`
// const REACT_APP_COGNTIO_USERPOOL_ID = `ca-central-1_cB0qPYbDc`
// const REACT_APP_GRAPHQL_URL = `https://aaa7ckxeorhc7ckp4zfgzp7rpm.appsync-api.ca-central-1.amazonaws.com/graphql`
// const REACT_APP_REGION = `ca-central-1`

ConsoleLogger.LOG_LEVEL = 'ERROR'

const existingConfig = Amplify.getConfig()

export async function custom_headers() {
    const accessToken = (await fetchAuthSession()).tokens?.accessToken?.toString()
    return { Authorization: `Bearer ${accessToken}` }
}

const libraryOptions = {
    API: {
        GraphQL: {
            headers: custom_headers,
        },
        REST: {
            headers: custom_headers,
        },
    },
}

Amplify.configure(
    {
        ...existingConfig,
        Auth: {
            ...existingConfig.Auth,
            Cognito: {
                ...existingConfig.Auth?.Cognito,
                userPoolId: process.env.REACT_APP_COGNTIO_USERPOOL_ID ?? REACT_APP_COGNTIO_USERPOOL_ID,
                userPoolClientId: process.env.REACT_APP_COGNITO_CLIENT_ID ?? REACT_APP_COGNITO_CLIENT_ID,
                signUpVerificationMethod: 'code',
                loginWith: {
                    oauth: {
                        domain: process.env.REACT_APP_COGNITO_DOMAIN ?? REACT_APP_COGNITO_DOMAIN,
                        scopes: [
                            'email',
                            'openid',
                            `${process.env.REACT_APP_BACKEND_URL ?? REACT_APP_BACKEND_URL}/plaid.rw}`,
                        ],
                        responseType: 'code',
                    },
                },
                mfa: {
                    status: 'off',
                },
                passwordFormat: {
                    requireNumbers: true,
                    minLength: 8,
                    requireLowercase: true,
                    requireSpecialCharacters: true,
                    requireUppercase: true,
                },
            },
        },
        API: {
            ...existingConfig.API,
            GraphQL: {
                ...existingConfig.API?.GraphQL,
                endpoint: process.env.REACT_APP_GRAPHQL_URL ?? REACT_APP_GRAPHQL_URL,
                region: process.env.REACT_APP_REGION ?? REACT_APP_REGION,
                defaultAuthMode: 'none',
            },
            REST: {
                ...existingConfig.API?.REST,
                plaidapi: {
                    endpoint: process.env.REACT_APP_BACKEND_URL ?? REACT_APP_BACKEND_URL,
                    region: process.env.REACT_APP_REGION ?? REACT_APP_REGION,
                },
            },
        },
    },
    libraryOptions
)

const config = Amplify.getConfig()
console.log('CONFIG:', config)
