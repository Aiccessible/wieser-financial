import React from 'react'
import { Link } from '../Link'
import { useSidebar } from './use-sidebar'

type Props = {
    icon?: React.ReactNode
    title: string
    href: string
    disabled?: Boolean
}

const LinkItem = (props: Props) => {
    const { title, disabled } = props
    const isSidebarOpen = useSidebar((state) => state.isSidebarOpen)
    const handleClick = (event: any) => {
        if (disabled) {
            event.preventDefault()
        }
    }
    return (
        <Link
            onClick={handleClick}
            className={
                disabled
                    ? 'cursor-not-allowed opacity-50'
                    : `group relative flex items-center gap-2.5  rounded-sm px-3 py-2 font-medium text-gray-3  duration-300 ease-in-out  dark:hover:text-white `
            }
            to={props.href}
        >
            <div className="">{props.icon}</div>
            <p>{isSidebarOpen && title}</p>
        </Link>
    )
}

export default LinkItem
