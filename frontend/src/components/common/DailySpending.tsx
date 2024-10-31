import { useAppSelector } from '../../hooks'
import React, { useCallback, useMemo, useRef } from 'react'
import { Spending } from './Spending'
import { current } from '@reduxjs/toolkit'
import { calculateAverageSpendingFromMonthlySummarys, calculateTotalSpending } from './spendingUtils'
interface Props {
    width: number
}

export const DailySpending: React.FC<Props> = ({ width }) => {
    const dailySpendsLastXDays = useAppSelector((state) => state.transactions.dailySummaries)
    const monthlySpending = useAppSelector((state) => state.transactions.monthlySummaries)
    const dateRange = useAppSelector((state) => state.transactions.currentDateRange)
    const averageDailySpending = useMemo(() => {
        return calculateAverageSpendingFromMonthlySummarys(monthlySpending ?? [])
    }, [monthlySpending])

    const totalSpendingInTimePeriod = useCallback(() => {
        return dateRange && dateRange?.length === 2
            ? calculateTotalSpending(dailySpendsLastXDays ?? [])
            : dailySpendsLastXDays?.[0]?.spending
    }, [dateRange, dailySpendsLastXDays])
    console.log(totalSpendingInTimePeriod())
    const dateOrUndefined = (dailySpendsLastXDays?.[0] as any)?.date
    const actualRange = dateRange && dateRange?.length === 2 ? dateRange : [dateOrUndefined, dateOrUndefined]
    const date =
        dateRange && dateRange?.length === 2
            ? 'Spending from ' +
              new Date(dateRange?.[0])?.toDateString() +
              ' to ' +
              new Date(dateRange?.[1])?.toDateString()
            : dateOrUndefined
            ? 'Spending from ' + new Date(dateOrUndefined).toDateString()
            : 'No spending found'
    return (
        <Spending
            dateRange={actualRange as any}
            spending={totalSpendingInTimePeriod() as Record<string, number>}
            title={date}
        />
    )
}
