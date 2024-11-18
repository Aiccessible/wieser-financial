import React from 'react'
import HighchartsReact from '../native/Chats'
import * as Highcharts from 'highcharts'
import HighchartsExportData from 'highcharts/modules/export-data'
import HighchartsAccessibility from 'highcharts/modules/accessibility'

// import './graph.css'
import { SpendingSummary } from '@/src/API'
import { calculateTotalSpendingInCategoriesAsTotal } from './spendingUtils'
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
    copy.sort((el: any, el2: any) => el.date - el2.date)
    console.info('calculation2', copy)
    const spendingData = copy.map((spending) => ({
        name: new Date((spending as any).date).toDateString(),
        y: calculateTotalSpendingInCategoriesAsTotal(spending),
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
                        text: 'Average Spending', // No title for a cleaner look
                        align: 'left',
                    },
                    xAxis: {
                        lineColor: 'transparent', // Hide x-axis line
                        tickColor: 'transparent',
                        labels: {
                            style: {
                                color: '#a5d6a7', // Light green for labels
                            },
                        },
                    },
                    yAxis: {
                        visible: false, // Hide y-axis completely
                    },
                    legend: {
                        enabled: false, // No legend for simplicity
                    },
                    plotOptions: {
                        series: {
                            lineWidth: 2,
                            marker: {
                                enabled: true, // Show markers on specific points
                                radius: 6, // Marker size
                                fillColor: '#ffffff', // White marker
                                lineWidth: 2,
                                lineColor: '#a5d6a7', // Border around markers
                            },
                        },
                    },
                    series: [
                        {
                            name: 'Spending',
                            data: spendingData, // Replace with your data
                            color: '#a5d6a7', // Smooth light green line
                            type: 'line',
                        },
                    ],
                } as Highcharts.Options
            }
        />
    )
}
