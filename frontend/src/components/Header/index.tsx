import { Link, useLocation } from 'react-router-dom'
import DropdownUser from './DropdownUser'
import { MenuIcon } from 'lucide-react'
import { useSidebar } from '../Sidebar/use-sidebar'
import BalanceVisibilitySwitcher from '../../../src/utils/EyeSwitcher'
import ScoreIndicators from '../Scores'
import { useAppDispatch, useAppSelector } from '../../../src/hooks'
import { setNewChatVal } from '../../../src/features/chat'

import { Button } from '@aws-amplify/ui-react'
import { usePostChat } from '../hooks/usePostChat'

const Header = (props: {
    sidebarOpen: string | boolean | undefined
    chatbarOpen: boolean
    setSidebarOpen: (arg0: boolean) => void
    setChatbarOpen: (arg0: boolean) => void
}) => {
    const { toggleSidebar, isSidebarOpen } = useSidebar((state) => state)
    const newChat = useAppSelector((state) => state.chat.newChat)
    const dispatch = useAppDispatch()

    const activeSimulationName = useAppSelector((state) => state.analysis.activeSimulationName)
    const location = useLocation() // Access the current route
    let activeTab = location.pathname.includes('analyze') ? 'Plan' : 'unknown'
    const { postChat } = usePostChat()
    return (
        <header
            style={{ zIndex: 800 }}
            className="sticky top-0 flex flex-col w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none"
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
                            console.info(activeSimulationName)
                            postChat(e.currentTarget.value)
                        }}
                        method="POST"
                    >
                        <div className="relative flex">
                            <div className="">
                                <input
                                    type="text"
                                    placeholder={
                                        activeTab === 'Plan'
                                            ? activeSimulationName
                                                ? 'Tell Wieser how to change the simulation'
                                                : 'Tell Wieser what to simulate'
                                            : 'Chat with Wieser'
                                    }
                                    className="w-full flex-grow bg-transparent pl-9 pr-4 font-medium focus:outline-none xl:w-125 text-black dark:placeholder-whiten dark:text-whiten dark:bg-secondary rounded-3xl"
                                    value={newChat}
                                    style={{ minHeight: 60 }}
                                    onChange={(e) => {
                                        dispatch(setNewChatVal(e.currentTarget.value))
                                    }}
                                />
                            </div>
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
            {activeTab === 'Plan' && !activeSimulationName && (
                <div className="flex flex-wrap gap-2 p-4">
                    {[
                        'Simulate me buying a house using money from my FHSA and RRSP',
                        'Simulate me getting promoted at work',
                        'Simulate me starting a side-business',
                    ].map((question, index) => (
                        <Button
                            key={index}
                            className="bg-primary text-black px-4 py-2 rounded-full hover:bg-green-700 transition ease-in-out"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                postChat(question)
                            }}
                        >
                            {question}
                        </Button>
                    ))}
                </div>
            )}
        </header>
    )
}

export default Header
