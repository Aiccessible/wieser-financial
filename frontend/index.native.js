import { registerRootComponent } from 'expo'
if (typeof window.queueMicrotask !== 'function') {
    window.queueMicrotask = function (callback) {
        Promise.resolve()
            .then(callback)
            .catch((e) =>
                setTimeout(() => {
                    throw e
                })
            )
    }
}
import * as Notifications from 'expo-notifications'

import App from './src/App'


//get push notification permissions.

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
})

//async() => clearAsyncStorage();
// registerForPushNotificationsAsync()

// setUpListeners()

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App)
