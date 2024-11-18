import React, { useState } from 'react'
import { AppRegistry, Platform, SafeAreaView, StatusBar, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Authenticator, useAuthenticator } from './libs/amplify'
import { Provider } from 'react-redux'
import { store } from './store'
import './index.css'
import '../App.css'
import { PortalHost } from '@rn-primitives/portal'
import { Home, DollarSign, BarChart2, User, BrainCircuitIcon } from 'lucide-react-native' // Example icons

// Screens
import Login from './pages/Login'
import Institution from './pages/Institution'
import Transactions from './components/Transactions'
import Investments from './components/Investments'
import Accounts from './components/Accounts'
import { useAppDispatch, useAppSelector } from './hooks'
import { setIsChatOpen } from './features/chat'
import Chatbar from './components/Chatbar/Chatbar'
import Header from './components/Header'
import ScoreIndicators from './components/Scores'
import Projection from './components/Analysis/Projection'

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

function RequireAuth({ children }: { children: React.ReactNode }) {
    const { user } = useAuthenticator((context) => [context.user])
    console.info(user)
    if (!user) {
        return <Login />
    }

    return <>{children}</>
}

const AppNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Layout" component={Login} />
            <Stack.Screen name="Institution" component={InstitutionTabs} />
        </Stack.Navigator>
    )
}

const InstitutionTabs = () => {
    const chatbarOpen = useAppSelector((state) => state.chat.chatOpen)
    const dispatch = useAppDispatch()
    const setChatbarOpen = (val: boolean) => dispatch(setIsChatOpen(val))
    const [activeTab, setActiveTab] = useState('')
    return (
        <View className="flex-1">
            <RequireAuth>
                <PortalHost />
                <Header
                    sidebarOpen={false}
                    setSidebarOpen={() => {}}
                    setChatbarOpen={setChatbarOpen}
                    chatbarOpen={chatbarOpen}
                    activeTab={activeTab}
                />
                <Chatbar activeTab={activeTab} isSidebarOpen={chatbarOpen} setIsSidebarOpen={setChatbarOpen} />
                <Tab.Navigator
                    screenOptions={{
                        tabBarStyle: { backgroundColor: '#122011' },
                        tabBarActiveTintColor: '#d3fc82', // Active color
                        tabBarInactiveTintColor: '#9ca3af', // Inactive color
                        headerShown: false,
                    }}
                    screenListeners={{
                        state: (e) => {
                            const activeRoute = e.data.state.routes[e.data.state.index].name
                            setActiveTab(activeRoute)
                        },
                    }}
                >
                    <Tab.Screen
                        name="Institution"
                        component={Institution}
                        options={{
                            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                        }}
                    />
                    <Tab.Screen
                        name="Transactions"
                        component={Transactions}
                        options={{
                            tabBarIcon: ({ color, size }) => <DollarSign color={color} size={size} />,
                        }}
                    />
                    <Tab.Screen
                        name="Plan"
                        component={Projection}
                        options={{
                            tabBarIcon: ({ color, size }) => <BrainCircuitIcon color={color} size={size} />,
                        }}
                    />
                    <Tab.Screen
                        name="Investments"
                        component={Investments}
                        options={{
                            tabBarIcon: ({ color, size }) => <BarChart2 color={color} size={size} />,
                        }}
                    />
                    <Tab.Screen
                        name="Accounts"
                        component={Accounts as any}
                        options={{
                            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
                        }}
                    />
                </Tab.Navigator>
            </RequireAuth>
        </View>
    )
}

function App() {
    return (
        <Authenticator.Provider>
            <Provider store={store}>
                <SafeAreaView style={{ flex: 1, backgroundColor: '#122011' }}>
                    <StatusBar backgroundColor="#122011" barStyle="light-content" />
                    <NavigationContainer>
                        <StatusBar backgroundColor="#122011" barStyle="light-content" />
                        <AppNavigator />
                    </NavigationContainer>
                </SafeAreaView>
            </Provider>
        </Authenticator.Provider>
    )
}

AppRegistry.registerComponent('main', () => App)

if (Platform.OS === 'web') {
    const rootTag = document.getElementById('root') || document.getElementById('main')
    AppRegistry.runApplication('main', { rootTag })
}

export default App
