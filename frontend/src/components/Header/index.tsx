import { Link } from '../Link'
import DropdownUser from './DropdownUser'
import { MenuIcon } from 'lucide-react-native'
import { useSidebar } from '../Sidebar/use-sidebar'
import BalanceVisibilitySwitcher from '../../../src/utils/EyeSwitcher'
import { useAppDispatch, useAppSelector } from '../../../src/hooks'
import { sendChatToLLM, setIsChatOpen, setNewChatVal } from '../../../src/features/chat'
import { generateClient } from 'aws-amplify/api'
import { ChatFocus } from '../../../src/API'
import { useDefaultValuesForProjection } from '../hooks/useDefaultValuesForProjection'
import { TextInput, TouchableOpacity, View, Image } from 'react-native'
import { getFinancialSimulationExpansionThunk } from '../../../src/features/analysis'

const Header = (props: {
    sidebarOpen: string | boolean | undefined
    chatbarOpen: boolean
    setSidebarOpen: (arg0: boolean) => void
    setChatbarOpen: (arg0: boolean) => void
    activeTab: string
}) => {
    const { activeTab } = props
    const { toggleSidebar, isSidebarOpen } = useSidebar((state) => state)
    const newChat = useAppSelector((state) => state.chat.newChat)
    const dispatch = useAppDispatch()
    const client = generateClient()
    const projection = useDefaultValuesForProjection({})
    const accounts = useAppSelector((state) => state.accounts.accounts)
    const activeSimulationKey = useAppSelector((state) => state.analysis.activeSimulationKey)
    return (
        <View style={{ zIndex: 800 }}>
            <View
                style={{ zIndex: 800 }}
                className="sticky top-0 flex flex-col w-full bg-black drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none py-2"
            >
                <View className="flex flex-grow flex-row items-center justify-between px-4 py-4 shadow-2  2xl:px-11">
                    <View className="flex items-center gap-2 sm:gap-4 ">
                        {/* <!-- Hamburger Toggle BTN --> */}
                        {!isSidebarOpen && (
                            <TouchableOpacity
                                onPress={toggleSidebar}
                                aria-hidden={!isSidebarOpen}
                                aria-controls="sidebar"
                            >
                                <MenuIcon className="h-6 w-6 text-white" />
                            </TouchableOpacity>
                        )}
                        {/* <!-- Hamburger Toggle BTN --> */}

                        <Link className="block flex-shrink-0 lg:hidden" to="/">
                            <Image
                                source={require('../../../public/images/logo/logo-icon.png')} // Adjust the path as needed
                                style={{ width: 32, height: 32 }}
                                resizeMode="contain" // Ensures the image fits within the bounds
                                accessible={true} // Accessibility props for better screen reader support
                                accessibilityLabel="Logo"
                            />
                        </Link>
                    </View>

                    <View className="w-[100%] flex-col sm:block">
                        <View className="relative flex flex-row">
                            <TextInput
                                placeholder={
                                    activeTab === 'Plan'
                                        ? 'Tell Wieser what you need to project'
                                        : activeTab === 'Transactions'
                                        ? 'Ask Wieser how much you spent on food '
                                        : 'Chat with Wieser'
                                }
                                placeholderTextColor="#9bc39d"
                                className="w-full flex-grow bg-transparent pl-9 pr-4 font-medium focus:outline-none xl:w-125 text-whiten placeholder-whiten  dark:bg-secondary rounded-3xl"
                                value={newChat}
                                onChangeText={(e) => dispatch(setNewChatVal(e))}
                                onSubmitEditing={() => {
                                    if (activeTab === 'Plan') {
                                        dispatch(
                                            getFinancialSimulationExpansionThunk({
                                                client: client,
                                                input: {
                                                    message: newChat,
                                                    s3Key: activeSimulationKey,
                                                },
                                            })
                                        )
                                    } else {
                                        dispatch(setIsChatOpen(true))
                                        dispatch(
                                            sendChatToLLM({
                                                newChat: newChat,
                                                client,
                                                focus: ChatFocus.All,
                                                ids: accounts?.map((el) => el.account_id) ?? [],
                                                highLevelSpendingCategory: undefined,
                                                currentDateRange: undefined,
                                                projection,
                                            })
                                        )
                                    }
                                }}
                            />
                        </View>
                    </View>

                    <View className="flex items-center gap-3 2xsm:gap-7">
                        <View className="flex flex-row items-center gap-2 2xsm:gap-4 ">
                            <BalanceVisibilitySwitcher />
                            <DropdownUser />

                            {/* <!-- Dark Mode Toggler --> */}
                        </View>

                        {/* <!-- User Area --> */}
                        {/* <!-- User Area --> */}
                    </View>
                </View>
            </View>
        </View>
    )
}

export default Header
