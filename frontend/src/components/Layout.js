import React from 'react'
import { View, Button, StyleSheet } from 'react-native'
import { useAuthenticator } from '../libs/amplify'
import { useNavigation } from '@react-navigation/native'

export default function Layout() {
    const { route, signOut, user } = useAuthenticator((context) => [context.route, context.signOut, context.user])

    const navigation = useNavigation()

    function logOut() {
        signOut()
        navigation.navigate('Login') // Assuming 'Login' is a valid route
    }

    return (
        <View style={styles.container}>
            {/* Include any common UI elements like headers or footers here */}
            <Button title="Logout" onPress={logOut} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
})
