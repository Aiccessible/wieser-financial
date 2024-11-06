import { Link } from 'react-router-dom'
import DarkModeSwitcher from './DarkModeSwitcher'
import DropdownMessage from './DropdownMessage'
import DropdownNotification from './DropdownNotification'
import DropdownUser from './DropdownUser'
import { MenuIcon } from 'lucide-react'
import { useSidebar } from '../Sidebar/use-sidebar'
import BalanceVisibilitySwitcher from '../../../src/utils/EyeSwitcher'
import ScoreIndicators from '../Scores'
import { useAppDispatch, useAppSelector } from '../../../src/hooks'
import { sendChatToLLM, setIsChatOpen, setNewChatVal } from '../../../src/features/chat'
import { generateClient } from 'aws-amplify/api'
import { ChatFocus } from '../../../src/API'

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
    const accounts = useAppSelector((state) => state.accounts.accounts)
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
                            dispatch(setIsChatOpen(true))
                            dispatch(
                                sendChatToLLM({
                                    newChat: newChat,
                                    client,
                                    focus: ChatFocus.All,
                                    ids: accounts?.map((el) => el.account_id) ?? [],
                                    highLevelSpendingCategory: undefined,
                                    currentDateRange: undefined,
                                })
                            )
                        }}
                        method="POST"
                    >
                        <div className="relative flex">
                            <input
                                type="text"
                                placeholder="Chat with Wieser"
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
