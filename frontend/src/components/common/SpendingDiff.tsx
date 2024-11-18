import { SpendingSummary } from '@/src/API'
import { CustomTextBox } from './CustomTextBox'
import { useCallback } from 'react'
import { calculateAverageSpendingFromMonthlySummarys, calculateTotalSpending } from './spendingUtils'
import Loader from '../../components/common/Loader'
import { useAppSelector } from '../../../src/hooks'
import { Text, TouchableOpacity, View } from 'react-native'
import * as Accordion from '../../components/native/Accordion'
import { DatePickerCustom } from './DatePicker'

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
        dateRange && dateRange?.length > 0 ? 'Your spending was ' + (totalSpend > realAvg ? 'higher +' : 'lower ') : ''
    const classname = totalSpend > realAvg ? 'text-red-600' : 'text-green-600'
    const suffix =
        dateRange && dateRange?.length == 2
            ? `% than your average ${numDays.toFixed(0)} day spending`
            : `% ${new Date((dailySpending as any)?.date).toDateString()}`
    return (
        <View className="bg-gray-800 p-1 rounded-lg text-white ">
            {dailySpending?.spending ? (
                <>
                    <View className="flex flex-row">
                        <Accordion.Root type="single" collapsible className="w-full">
                            {/* Net Worth Section */}
                            <Accordion.Item value="item-1">
                                <Accordion.Header>
                                    <Accordion.Trigger
                                        asChild
                                        className="flex  justify-evenly w-full px-4  text-lg font-medium bg-gray-800 text-white rounded-t-md"
                                    >
                                        <TouchableOpacity className="flex flex-row items-center">
                                            <CustomTextBox className="text-3xl font-bold mb-2 flex ">
                                                ${balancesVisible ? totalSpend.toFixed(2) : '***'}
                                            </CustomTextBox>
                                            <Text className="text-primary">Select Date Range</Text>
                                        </TouchableOpacity>
                                    </Accordion.Trigger>
                                </Accordion.Header>
                                <Accordion.Content className="px-4 bg-gray-900 text-white">
                                    <DatePickerCustom />
                                </Accordion.Content>
                            </Accordion.Item>
                        </Accordion.Root>
                    </View>
                    {balancesVisible && (
                        <CustomTextBox className={classname}>
                            {prefix}
                            {spendPart}
                            {suffix}
                        </CustomTextBox>
                    )}
                </>
            ) : (
                <></>
            )}
        </View>
    )
}
