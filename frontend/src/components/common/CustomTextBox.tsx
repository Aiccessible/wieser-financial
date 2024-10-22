import { FunctionComponent } from 'react'

export const CustomTextBox = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <p className={` ${className ?? ''} text-black dark:text-white`}>{children}</p>
)
