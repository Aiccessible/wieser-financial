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
import { CustomTextBox } from '../common/CustomTextBox'

interface SidebarProps {}

const Sidebar = ({}: SidebarProps) => {
    const pathname = ''
    const { isSidebarOpen, toggleSidebar } = useSidebar((state) => state)
    const { id } = useParams()

    return (
        <aside
            className={cn(
                `absolute left-0 top-0 z-997 flex h-screen w-20 flex-col overflow-y-hidden duration-300 ease-linear  dark:bg-boxdark lg:static lg:translate-x-0 border-right-2 border-black rounded-lg shadow-lg`,
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
                    {isSidebarOpen && (
                        <h1 className=" ml-2 text-xl font-semibold text-white">
                            <CustomTextBox>Wieser</CustomTextBox>
                        </h1>
                    )}
                </Link>
                <CustomTextBox>
                    {isSidebarOpen && <MenuIcon onClick={toggleSidebar} className="h-6 w-6" />}
                </CustomTextBox>
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
                                <LinkItem
                                    disabled={!id}
                                    title={(<CustomTextBox>HomePage</CustomTextBox>) as any}
                                    href={id ? `/institution/${id}` : '/institution'}
                                    icon={
                                        <CustomTextBox>
                                            <HomeIcon className="  h-6 w-6 hover:text-white" />
                                        </CustomTextBox>
                                    }
                                ></LinkItem>
                            </li>
                            {/* <!-- Menu Item Dashboard --> */}

                            {/* <!-- Menu Item Calendar --> */}
                            <li>
                                <LinkItem
                                    disabled={!id}
                                    title={(<CustomTextBox>Transactions</CustomTextBox>) as any}
                                    href={id ? `/institution/${id}/transactions` : 'transactions'}
                                    icon={
                                        <CustomTextBox>
                                            <ActivityIcon className="h-6 w-6" />
                                        </CustomTextBox>
                                    }
                                ></LinkItem>
                            </li>

                            <li>
                                <LinkItem
                                    disabled={!id}
                                    title={(<CustomTextBox>Investments</CustomTextBox>) as any}
                                    href={id ? `/institution/${id}/investments` : '/investments'}
                                    icon={
                                        <CustomTextBox>
                                            <BarChart2 className="h-6 w-6" />
                                        </CustomTextBox>
                                    }
                                ></LinkItem>
                            </li>

                            <li>
                                <LinkItem
                                    disabled={!id}
                                    title={(<CustomTextBox>The Lab</CustomTextBox>) as any}
                                    href={id ? `/analyze/${id}` : '/analyze'}
                                    icon={
                                        <CustomTextBox>
                                            <BrainCircuitIcon className="h-6 w-6" />
                                        </CustomTextBox>
                                    }
                                ></LinkItem>
                            </li>

                            {/* <!-- Menu Item Tables --> */}

                            {/* <!-- Menu Item Settings --> */}
                            <li>
                                <LinkItem
                                    disabled={true}
                                    title={(<CustomTextBox>Settings</CustomTextBox>) as any}
                                    href="/settings"
                                    icon={
                                        <CustomTextBox>
                                            <Settings className="h-6 w-6" />
                                        </CustomTextBox>
                                    }
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
