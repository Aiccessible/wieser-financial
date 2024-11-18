import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react-native'
import { useNavigation, useRoute } from '@react-navigation/native'

export default function Login() {
    const { route } = useAuthenticator((context) => [context.route])
    const navigation = useNavigation()
    const currentRoute = useRoute()

    // Get the 'from' route for post-login redirection
    const from = currentRoute.params?.from || 'Institution' // Default to 'Institution' screen

    const components = {
        SignUp: {
            Footer() {
                return (
                    <View style={styles.footer}>
                        <strong>Password Policy</strong>:
                        <ul>
                            <li>Minimum of 8 characters</li>
                            <li>At least one lowercase character</li>
                            <li>At least one uppercase character</li>
                            <li>At least one number character</li>
                            <li>At least one symbol character</li>
                        </ul>
                    </View>
                )
            },
        },
    }

    useEffect(() => {
        if (route === 'authenticated') {
            navigation.replace(from) // Navigate to 'from' screen after successful login
        }
    }, [route, navigation, from])

    return (
        <View className="auth-wrapper">
            <Authenticator components={components} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'red'
    },
    footer: {
        textAlign: 'center',
        marginTop: 20,
    },
})
