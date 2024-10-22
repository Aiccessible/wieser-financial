import { TableRow, TableCell } from '@tremor/react'

export const CustomTableCell = ({ children }: { children: React.ReactNode }) => (
    <TableCell className="items-center justify-center p-2.5 xl:p-5">{children}</TableCell>
)
