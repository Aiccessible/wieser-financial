import { SpendingSummary } from '@/src/API'
import { CustomTextBox } from './CustomTextBox'
import { useCallback } from 'react'
import { calculateAverageSpendingFromMonthlySummarys, calculateTotalSpending } from './spendingUtils'
import Loader from '../../components/common/Loader'
import { useAppSelector } from '../../../src/hooks'

export const SpendingDiff = ({
    dailySpending,
    monthlySummaries,
    balancesVisible,
}: {
    dailySpending: SpendingSummary
    monthlySummaries: SpendingSummary[]
    balancesVisible: boolean
}) => {
    const dateRange = useAppSelector((state) => state.transactions.currentDateRange)
    const dailySpendsLastXDays = useAppSelector((state) => state.transactions.dailySummaries)

    const getTotalSpend = useCallback((): any => {
        let spending = dailySpending?.spending as any
        if (dateRange && dateRange?.length === 2) {
            spending = calculateTotalSpending(dailySpendsLastXDays ?? [])
        }
        return spending
            ? Object.values(spending as any).reduce((currVal: any, val: any) => currVal + val, 0)
            : 'Loading...'
    }, [dailySpending, dateRange, dailySpendsLastXDays])

    const getAverageTotalSpend = useCallback(() => {
        return monthlySummaries
            ? Object.values(calculateAverageSpendingFromMonthlySummarys(monthlySummaries)).reduce(
                  (currVal: any, val: any) => currVal + val,
                  0
              )
            : 'Loading...'
    }, [monthlySummaries])

    const totalSpend = getTotalSpend()
    const averageTotalSpend = getAverageTotalSpend()
    const numDays = dateRange && dateRange?.length == 2 ? (dateRange[1] - dateRange[0]) / 1000 / 60 / 60 / 24 : 1
    const realAvg = (averageTotalSpend / monthlySummaries.length) * numDays
    const spendPart = `${(totalSpend - realAvg).toFixed(2)} / ${((100 * (totalSpend - realAvg)) / realAvg).toFixed(2)}`
    const prefix =
        dateRange && dateRange?.length == 2 ? 'Your spending was ' + (totalSpend > realAvg ? 'higher +' : 'lower ') : ''
    const classname = totalSpend > realAvg ? 'text-red-400' : 'text-green-400'
    const suffix =
        dateRange && dateRange?.length == 2
            ? `% than your average ${numDays.toFixed(0)} day spending`
            : `% ${new Date((dailySpending as any)?.date).toDateString()}`
    return (
        <div className="bg-gray-800 p-1 rounded-lg text-white w-full">
            {dailySpending?.spending ? (
                <>
                    <CustomTextBox className="text-3xl font-bold mb-2">
                        ${balancesVisible ? totalSpend.toFixed(2) : '***'}
                    </CustomTextBox>
                    {balancesVisible && (
                        <CustomTextBox className={classname}>
                            {prefix}
                            {spendPart}
                            {suffix}
                        </CustomTextBox>
                    )}
                </>
            ) : (
                <Loader />
            )}
        </div>
    )
}
