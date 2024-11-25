import React from 'react'
import HighchartsReact from 'highcharts-react-official'
import * as Highcharts from 'highcharts'
import HighchartsExportData from 'highcharts/modules/export-data'
import HighchartsAccessibility from 'highcharts/modules/accessibility'

import '../graph.css'
import { ChatFocus, SpendingSummary } from '../../../../src/API'
import {
    calculateTotalsInCategoriesAsTotal,
    calculateTotalSpendingInCategoriesAsTotal,
    incomeKeys,
    spendingKeys,
} from '../../../libs/spendingUtils'
import { monthNames } from './MonthlySpending'
import { useAppDispatch } from '../../../../src/hooks'
import { setChatParams } from '../../../../src/features/chat'
import { getActiveTransactionsAsync } from '../../../../src/features/transactions'
import { generateClient } from 'aws-amplify/api'
HighchartsAccessibility(Highcharts)
HighchartsExportData(Highcharts)
interface Props {
    spending: SpendingSummary[]
    title: string
    isIncomeAndTransfers?: boolean
}

export const SpendingTimeline = (props: Props) => {
    const { spending } = props
    const copy = [...spending]

    // Filter and sort spending data for the current month
    const currentMonthData = copy.sort(
        (el: any, el2: any) => new Date(el.date).getTime() - new Date(el2.date).getTime()
    )

    const spendingData = currentMonthData.map((spending) => ({
        name: monthNames[new Date((spending as any).date).getMonth()], // Use day of the month as label
        y: calculateTotalSpendingInCategoriesAsTotal(spending),
        categories: spendingKeys,
    }))

    const incomeData = currentMonthData.map((spending) => ({
        name: monthNames[new Date((spending as any).date).getMonth()], // Use day of the month as label
        y: calculateTotalsInCategoriesAsTotal(spending, incomeKeys as any),
        categories: incomeKeys,
    }))
    const dispatch = useAppDispatch()
    const client = generateClient()
    return (
        <HighchartsReact
            highcharts={Highcharts}
            options={
                {
                    chart: {
                        type: 'spline', // Smooth line chart
                        plotBackgroundColor: undefined,
                    },
                    title: {
                        text: 'Average Spending', // Chart title
                        align: 'left',
                    },
                    xAxis: {
                        categories: spendingData.map((data) => data.name), // Use categories for x-axis
                        lineColor: 'transparent', // Hide x-axis line
                        tickColor: 'transparent',
                        labels: {
                            style: {
                                color: '#a5d6a7', // Light green for labels
                            },
                        },
                    },
                    yAxis: {
                        visible: true, // Hide y-axis completely
                    },
                    legend: {
                        enabled: true, // Enable legend to distinguish lines
                    },
                    plotOptions: {
                        series: {
                            lineWidth: 2,
                            marker: {
                                enabled: true, // Show markers on specific points
                                radius: 6, // Marker size
                                fillColor: '#ffffff', // White marker
                                lineWidth: 2,
                            },
                            point: {
                                events: {
                                    click: function (e) {
                                        const md = (this?.options as any).metadata
                                        const monthName = e.point.name
                                        const monthIndex = monthNames.findIndex((el) => el === monthName)
                                        // Assume a fixed year or dynamic year (e.g., current year)
                                        const year = new Date().getFullYear()

                                        // Get the start and end date of the month
                                        const startOfMonth = new Date(year, monthIndex, 1) // First day of the month
                                        const endOfMonth = new Date(year, monthIndex + 1, 0) // Last day of the month

                                        dispatch(
                                            setChatParams({
                                                scope: ChatFocus.Transaction,
                                                dateRange: [startOfMonth.getTime(), endOfMonth.getTime()],
                                            })
                                        )
                                        dispatch(
                                            getActiveTransactionsAsync({
                                                client: client,
                                                id: 'v0',
                                                highLevelPersonalCategory: md.categories,
                                                minDate: startOfMonth.getTime().toString() ?? '',
                                                maxDate: endOfMonth.getTime().toString() ?? '',
                                            })
                                        )
                                    },
                                },
                            },
                        },
                    },
                    series: [
                        {
                            name: 'Spending',
                            data: spendingData.map((data) => ({ y: data.y, metadata: { categories: spendingKeys } })),
                            color: '#a5d6a7', // Light green for spending
                            type: 'line',
                        },
                        {
                            name: 'Income',
                            data: incomeData.map((data) => ({ y: data.y, metadata: { categories: incomeKeys } })),
                            color: '#81c784', // Medium green for income
                            type: 'line',
                        },
                    ],
                } as Highcharts.Options
            }
        />
    )
}
