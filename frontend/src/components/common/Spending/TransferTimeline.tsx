import React from 'react'
import HighchartsReact from 'highcharts-react-official'
import * as Highcharts from 'highcharts'
import HighchartsExportData from 'highcharts/modules/export-data'
import HighchartsAccessibility from 'highcharts/modules/accessibility'

import '../graph.css'
import { ChatFocus, SpendingSummary } from '../../../../src/API'
import { calculateTotalsInCategoriesAsTotal, transferInKeys, transferOutKeys } from '../../../libs/spendingUtils'
import { monthNames } from './MonthlySpending'
import { greenShades } from './Charts/Spending'
import { useAppDispatch } from '../../../../src/hooks'
import { generateClient } from 'aws-amplify/api'
import { setChatParams } from '../../../../src/features/chat'
import { getActiveTransactionsAsync } from '../../../../src/features/transactions'
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
        const data = currentMonthData.map((spending) => ({
            name: monthNames[new Date((spending as any).date).getMonth()], // Use day of the month as label
            y: calculateTotalsInCategoriesAsTotal(spending, [el as any]),
            category: el,
        }))

        data.forEach((el) => {
            if (el.y > 0) {
                hasNonZero = true
            }
        })
        hasNonZero && datas.push(data)
    })
    const dispatch = useAppDispatch()
    const client = generateClient()
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
                            point: {
                                events: {
                                    click: function (e: any) {
                                        const md = (this as any)?.options.metadata
                                        const monthName = md.month
                                        const category = md.category
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
                                                highLevelTransactionCategory: [category],
                                            })
                                        )
                                        dispatch(
                                            getActiveTransactionsAsync({
                                                client: client,
                                                id: 'v0',
                                                highLevelPersonalCategory: [category],
                                                minDate: startOfMonth.getTime().toString() ?? '',
                                                maxDate: endOfMonth.getTime().toString() ?? '',
                                            })
                                        )
                                    },
                                },
                            },
                        },
                    },
                    series: datas.map((data: any, index) => ({
                        name: data[0].category,
                        data: data.map((elx: any) => ({
                            y: elx.y,
                            metadata: { category: data[0].category, month: data[0].name },
                        })),
                        color: greenShades[index % greenShades.length], // Light green for spending
                        type: 'line',
                    })),
                } as Highcharts.Options
            }
        />
    )
}
