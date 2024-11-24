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
import { greenShades } from './Charts/Spending'
HighchartsAccessibility(Highcharts)
HighchartsExportData(Highcharts)
interface Props {
    spending: SpendingSummary[]
    title: string
    isIncomeAndTransfers?: boolean
}

export const TransferTimeline = (props: Props) => {
    const { spending } = props
    const copy = [...spending]

    // Filter and sort spending data for the current month
    const currentMonthData = copy.sort(
        (el: any, el2: any) => new Date(el.date).getTime() - new Date(el2.date).getTime()
    )
    let datas: any[] = []

    const combined = [...transferInKeys, ...transferOutKeys]
    combined.map((el) => {
        let hasNonZero = false
        console.info(spending, el)
        const data = currentMonthData.map((spending) => ({
            name: monthNames[new Date((spending as any).date).getMonth()], // Use day of the month as label
            y: calculateTotalsInCategoriesAsTotal(el as any, [el as any]),
            category: el,
        }))
        console.info(data)

        data.forEach((el) => {
            if (el.y > 0) {
                hasNonZero = true
            }
        })
        hasNonZero && datas.push(data)
    })
    if (!datas?.length) {
        return <></>
    }
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
                        text: 'Transfer Timeline', // Chart title
                        align: 'left',
                    },
                    xAxis: {
                        categories: datas[0]?.map((data: any) => data.name) ?? [], // Use categories for x-axis
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
                    series: datas.map((data: any, index) => ({
                        name: data.category,
                        data: data.map((elx: any) => elx.y),
                        color: greenShades[index % greenShades.length], // Light green for spending
                        type: 'line',
                    })),
                } as Highcharts.Options
            }
        />
    )
}
