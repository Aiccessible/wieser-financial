import React from 'react'
import { Link, useParams } from 'react-router-dom'
import {
    MenuIcon,
    ShoppingBag,
    User2Icon,
    BarChart2,
    Settings,
    HomeIcon,
    ActivityIcon,
    BrainCircuitIcon,
} from 'lucide-react'
import { useSidebar } from './use-sidebar'
import { cn } from '../../libs/utlis'
import LinkItem from './LinkItem'
import ExpandMenu from './ExpandMenu'

interface SidebarProps {}

const Sidebar = ({}: SidebarProps) => {
    const pathname = ''
    const { isSidebarOpen, toggleSidebar } = useSidebar((state) => state)
    const { id } = useParams()

    return (
        <aside
            className={cn(
                `absolute left-0 top-0 z-997 flex h-screen w-20 flex-col overflow-y-hidden bg-black duration-300 ease-linear  dark:bg-boxdark lg:static lg:translate-x-0 `,
                {
                    'w-70': isSidebarOpen,
                }
            )}
        >
            {/* <!-- SIDEBAR HEADER --> */}
            <div className="relative flex w-full items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
                <Link className="flex items-center" to="/">
                    <img
                        loading="lazy"
                        className="h-6 w-6 rounded-md"
                        width={400}
                        height={400}
                        src={'/images/logo/logo-icon.png'}
                        alt="Logo"
                    />
                    {isSidebarOpen && <h1 className=" ml-2 text-xl font-semibold text-white">Wieser</h1>}
                </Link>
                {isSidebarOpen && <MenuIcon onClick={toggleSidebar} className="h-6 w-6" />}
            </div>
            {/* <!-- SIDEBAR HEADER --> */}

            <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
                {/* <!-- Sidebar Menu --> */}
                <nav className="px-4 py-4  lg:px-6">
                    {/* <!-- Menu Group --> */}
                    <div>
                        <ul
                            className={cn('mb-6 flex flex-col  gap-1.5', {
                                'items-center justify-center': !isSidebarOpen,
                            })}
                        >
                            {/* <!-- Menu Item Dashboard --> */}
                            <li>
                                <ExpandMenu name="Homepage" icon={<HomeIcon className="  h-6 w-6 hover:text-white" />}>
                                    <LinkItem icon={<ShoppingBag />} title="E-commerce" href="/" />
                                </ExpandMenu>
                            </li>
                            {/* <!-- Menu Item Dashboard --> */}

                            {/* <!-- Menu Item Calendar --> */}
                            <li>
                                <LinkItem
                                    title="Transactions"
                                    href={id ? `/institution/${id}/transactions` : 'transactions'}
                                    icon={<ActivityIcon className="h-6 w-6" />}
                                ></LinkItem>
                            </li>

                            <li>
                                <LinkItem
                                    title="Investments"
                                    href={id ? `/institution/${id}/investments` : '/investments'}
                                    icon={<BarChart2 className="h-6 w-6" />}
                                ></LinkItem>
                            </li>

                            <li>
                                <LinkItem
                                    title="Analyze"
                                    href="/analyze"
                                    icon={<BrainCircuitIcon className="h-6 w-6" />}
                                ></LinkItem>
                            </li>

                            {/* <!-- Menu Item Tables --> */}

                            {/* <!-- Menu Item Settings --> */}
                            <li>
                                <LinkItem
                                    title="Settings"
                                    href="/settings"
                                    icon={<Settings className="h-6 w-6" />}
                                ></LinkItem>
                            </li>

                            {/* <!-- Menu Item Auth Pages --> */}
                        </ul>
                    </div>
                </nav>
                {/* <!-- Sidebar Menu --> */}
            </div>
        </aside>
    )
}

export default Sidebar
