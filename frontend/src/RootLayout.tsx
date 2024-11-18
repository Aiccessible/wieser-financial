'use client'
import './data-tables-css.css'
import './satoshi.css'
import './loader.css'
import { useState, useEffect } from 'react'
import Loader from './components/common/Loader'

import Sidebar from './components/Sidebar/Sidebar'
import Header from './components/Header'
import ChatBar from './components/Chatbar/Chatbar'
import { Provider } from 'react-redux'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from './hooks'
import { setIsChatOpen } from './features/chat'

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const chatbarOpen = useAppSelector((state) => state.chat.chatOpen)
    const dispatch = useAppDispatch()
    const setChatbarOpen = (val: boolean) => dispatch(setIsChatOpen(val))

    const { id } = useParams()
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        setTimeout(() => setLoading(false), 1000)
    }, [])
    console.log(chatbarOpen)
    return (
        <div className="dark:bg-black dark:text-bodydark">
            {loading ? (
                <Loader />
            ) : (
                <div className="flex h-screen overflow-hidden">
                    {/* <!-- ===== Sidebar Start ===== --> */}
                    <Sidebar />
                    {/* <!-- ===== Sidebar End ===== --> */}

                    {/* <!-- ===== Content Area Start ===== --> */}
                    <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden hide-scrollbar">
                        {/* <!-- ===== Header Start ===== --> */}
                        <Header
                            sidebarOpen={sidebarOpen}
                            setSidebarOpen={setSidebarOpen}
                            setChatbarOpen={setChatbarOpen}
                            chatbarOpen={chatbarOpen}
                        />
                        {/* <!-- ===== Header End ===== --> */}

                        {/* <!-- ===== Main Content Start ===== --> */}
                        <main className="h-[calc(100vh-6rem)]">
                            <div className="mx-auto max-w-screen-2xl p-4 md:p-4 2xl:p-6 h-full">{children}</div>
                        </main>
                        {/* <!-- ===== Main Content End ===== --> */}
                    </div>
                    <ChatBar activeTab={''} isSidebarOpen={chatbarOpen} setIsSidebarOpen={setChatbarOpen} />

                    {/* <!-- ===== Content Area End ===== --> */}
                </div>
            )}
        </div>
    )
}
