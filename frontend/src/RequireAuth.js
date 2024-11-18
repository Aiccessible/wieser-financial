import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { useAuthenticator } from './libs/amplify'
import { View, ActivityIndicator, StyleSheet } from 'react-native'

export default function RequireAuth({ children }) {
    const navigation = useNavigation()
    const { route } = useAuthenticator((context) => [context.route])

    if (route !== 'authenticated') {
        // Redirect to the Login screen if not authenticated
        navigation.navigate('Login')
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        )
    }

    return <>{children}</>
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
})
