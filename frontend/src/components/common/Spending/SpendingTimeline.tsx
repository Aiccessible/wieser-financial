import React from 'react'
import HighchartsReact from 'highcharts-react-official'
import * as Highcharts from 'highcharts'
import HighchartsExportData from 'highcharts/modules/export-data'
import HighchartsAccessibility from 'highcharts/modules/accessibility'

import '../graph.css'
import { SpendingSummary } from '@/src/API'
import {
    calculateTotalsInCategoriesAsTotal,
    calculateTotalSpendingInCategoriesAsTotal,
    incomeKeys,
    transferInKeys,
    transferOutKeys,
} from '../../../libs/spendingUtils'
import { monthNames } from './MonthlySpending'
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
    }))

    const incomeData = currentMonthData.map((spending) => ({
        name: monthNames[new Date((spending as any).date).getMonth()], // Use day of the month as label
        y: calculateTotalsInCategoriesAsTotal(spending, incomeKeys as any),
    }))

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
                        },
                    },
                    series: [
                        {
                            name: 'Spending',
                            data: spendingData.map((data) => data.y),
                            color: '#a5d6a7', // Light green for spending
                            type: 'line',
                        },
                        {
                            name: 'Income',
                            data: incomeData.map((data) => data.y),
                            color: '#81c784', // Medium green for income
                            type: 'line',
                        },
                    ],
                } as Highcharts.Options
            }
        />
    )
}
