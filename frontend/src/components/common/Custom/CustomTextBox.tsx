import { FunctionComponent } from 'react'

export const CustomTextBox = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <p className={`text-black dark:text-white ${className ?? ''} `}>{children}</p>
)
