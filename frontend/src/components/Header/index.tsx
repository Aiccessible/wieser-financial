import { Link, useLocation } from 'react-router-dom'
import DropdownUser from './DropdownUser'
import { MenuIcon } from 'lucide-react'
import { useSidebar } from '../Sidebar/use-sidebar'
import BalanceVisibilitySwitcher from '../../../src/utils/EyeSwitcher'
import ScoreIndicators from '../Scores'
import { useAppDispatch, useAppSelector } from '../../../src/hooks'
import { sendChatToLLM, setIsChatOpen, setNewChatVal } from '../../../src/features/chat'
import { generateClient } from 'aws-amplify/api'
import { ChatFocus } from '../../../src/API'
import { useDefaultValuesForProjection } from '../hooks/useDefaultValuesForProjection'
import { getFinancialSimulationExpansionThunk } from '../../../src/features/analysis'

const Header = (props: {
    sidebarOpen: string | boolean | undefined
    chatbarOpen: boolean
    setSidebarOpen: (arg0: boolean) => void
    setChatbarOpen: (arg0: boolean) => void
}) => {
    const { toggleSidebar, isSidebarOpen } = useSidebar((state) => state)
    const newChat = useAppSelector((state) => state.chat.newChat)
    const dispatch = useAppDispatch()
    const client = generateClient()
    const projection = useDefaultValuesForProjection({})
    const activeSimulationKey = useAppSelector((state) => state.analysis.activeSimulationKey)
    const accounts = useAppSelector((state) => state.accounts.accounts)
    const location = useLocation() // Access the current route
    console.info(location.pathname.includes('analyze'))
    let activeTab = location.pathname.includes('analyze') ? 'Plan' : 'unknown'
    console.info(activeTab)
    return (
        <header
            style={{ zIndex: 800 }}
            className="sticky top-0 flex w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none"
        >
            <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
                <div className="flex items-center gap-2 sm:gap-4 ">
                    {/* <!-- Hamburger Toggle BTN --> */}
                    {!isSidebarOpen && (
                        <button onClick={toggleSidebar} aria-hidden={!isSidebarOpen} aria-controls="sidebar">
                            <MenuIcon className="h-6 w-6 text-white" />
                        </button>
                    )}
                    {/* <!-- Hamburger Toggle BTN --> */}

                    <Link className="block flex-shrink-0 lg:hidden" to="/">
                        <img loading="lazy" width={32} height={32} src={'/images/logo/logo-icon.svg'} alt="Logo" />
                    </Link>
                </div>

                <div className="hidden flex-grow flex-col sm:block">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
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
                        method="POST"
                    >
                        <div className="relative flex">
                            <input
                                type="text"
                                placeholder={activeTab === 'Plan' ? 'Tell Wieser what to simulate' : 'Chat with Wieser'}
                                className="w-full flex-grow bg-transparent pl-9 pr-4 font-medium focus:outline-none xl:w-125 text-black dark:placeholder-whiten dark:text-whiten dark:bg-secondary rounded-3xl"
                                value={newChat}
                                onChange={(e) => dispatch(setNewChatVal(e.currentTarget.value))}
                            />
                            <ScoreIndicators />
                        </div>
                    </form>
                </div>

                <div className="flex items-center gap-3 2xsm:gap-7">
                    <ul className="flex items-center gap-2 2xsm:gap-4">
                        <BalanceVisibilitySwitcher />
                        {/* <!-- Dark Mode Toggler --> */}
                    </ul>

                    {/* <!-- User Area --> */}
                    <DropdownUser />
                    {/* <!-- User Area --> */}
                </div>
            </div>
        </header>
    )
}

export default Header
