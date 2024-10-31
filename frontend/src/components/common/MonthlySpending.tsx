import { useAppSelector } from '../../hooks'
import React, { useRef } from 'react'
import { Spending } from './Spending'
interface Props {
    width: number
}
const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
]
export const MonthlySpending: React.FC<Props> = ({ width }) => {
    const monthlySpending = useAppSelector((state) => state.transactions.monthlySummaries)
    const date = (monthlySpending?.[0] as any)?.date as number | undefined
    console.log(date)
    const currentDate = new Date(date ?? 0)
    const nextMonth = new Date(date ?? 0)
    nextMonth.setMonth(currentDate.getMonth() + 1)
    const month = date ? monthNames[new Date(date).getMonth()] + ' Spending' : 'No spending found'
    return (
        <Spending
            dateRange={[(monthlySpending?.[0] as any)?.date, date ? nextMonth.getTime() : undefined]}
            spending={(monthlySpending?.[0]?.spending as any) ?? []}
            title={month}
        />
    )
}
