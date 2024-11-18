import React from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { MenuIcon, BarChart2, HomeIcon, ActivityIcon, BrainCircuitIcon } from 'lucide-react'
import { useSidebar } from './use-sidebar'
import { cn } from '../../libs/utlis'
import LinkItem from './LinkItem'
import { CustomTextBox } from '../common/CustomTextBox'

const iconClass = 'bg-black rounded-full text-white p-1 h-7 w-7 hover:text-white'
interface SidebarProps {}

const SidebarTitle = (isActive: boolean, title: string) =>
    !isActive ? ((<CustomTextBox>{title}</CustomTextBox>) as any) : ((<p className="text-black">{title}</p>) as any)
const Sidebar = ({}: SidebarProps) => {
    const { isSidebarOpen, toggleSidebar } = useSidebar((state) => state)
    const { id } = useParams()
    const location = useLocation() // Get the current location
    const checkIsActive = (path: string) => {
        return location.pathname === path
    }
    return (
        <aside
            className={cn(
                `absolute left-0 top-0 z-997 flex h-screen w-20 flex-col overflow-y-hidden duration-300 ease-linear  dark:bg-boxdark lg:static lg:translate-x-0 border-right-2 border-black rounded-lg shadow-lg`,
                {
                    'w-60': isSidebarOpen,
                }
            )}
        >
            {/* <!-- SIDEBAR HEADER --> */}
            <div className="relative flex w-full items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
                <Link className="flex items-center" to="/">
                    <img
                        loading="lazy"
                        className="h-10 w-10 rounded-md"
                        width={800}
                        height={800}
                        src={'/images/logo/logo-icon.png'}
                        alt="Logo"
                    />
                    {isSidebarOpen && (
                        <h1 className=" ml-2 text-4xl font-semibold text-white">
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
                            <li className={checkIsActive(`/institution/${id}`) ? 'bg-primary rounded-3xl ' : ''}>
                                <LinkItem
                                    disabled={!id}
                                    title={SidebarTitle(checkIsActive(`/institution/${id}`), 'Homepage')}
                                    href={id ? `/institution/${id}` : '/institution'}
                                    icon={
                                        <CustomTextBox>
                                            <HomeIcon className={iconClass} />
                                        </CustomTextBox>
                                    }
                                ></LinkItem>
                            </li>
                            {/* <!-- Menu Item Dashboard --> */}

                            {/* <!-- Menu Item Calendar --> */}
                            <li
                                className={
                                    checkIsActive(`/institution/${id}/transactions`) ? 'bg-primary rounded-3xl ' : ''
                                }
                            >
                                <LinkItem
                                    disabled={!id}
                                    title={SidebarTitle(
                                        checkIsActive(`/institution/${id}/transactions`),
                                        'Transactions'
                                    )}
                                    href={id ? `/institution/${id}/transactions` : 'transactions'}
                                    icon={
                                        <CustomTextBox>
                                            <ActivityIcon className={iconClass} />
                                        </CustomTextBox>
                                    }
                                ></LinkItem>
                            </li>

                            <li
                                className={
                                    checkIsActive(`/institution/${id}/investments`) ? 'bg-primary rounded-3xl ' : ''
                                }
                            >
                                <LinkItem
                                    disabled={!id}
                                    title={SidebarTitle(checkIsActive(`/institution/${id}/investments`), 'Investments')}
                                    href={id ? `/institution/${id}/investments` : '/investments'}
                                    icon={
                                        <CustomTextBox>
                                            <BarChart2 className={iconClass} />
                                        </CustomTextBox>
                                    }
                                ></LinkItem>
                            </li>

                            <li className={checkIsActive(`/analyze/${id}`) ? 'bg-primary rounded-3xl ' : ''}>
                                <LinkItem
                                    disabled={!id}
                                    title={SidebarTitle(checkIsActive(`/analyze/${id}`), 'The Lab')}
                                    href={id ? `/analyze/${id}` : '/analyze'}
                                    icon={
                                        <CustomTextBox>
                                            <BrainCircuitIcon className={iconClass} />
                                        </CustomTextBox>
                                    }
                                ></LinkItem>
                            </li>

                            {/* <!-- Menu Item Tables --> */}

                            {/* <!-- Menu Item Settings --> */}

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
