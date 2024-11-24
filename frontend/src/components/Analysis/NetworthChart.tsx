import React, { useState } from 'react'
import * as Highcharts from 'highcharts'
import HighchartsReact from '../native/Chats'

import HighchartsExportData from 'highcharts/modules/export-data'
import HighchartsAccessibility from 'highcharts/modules/accessibility'
import { useAppSelector } from '../../../src/hooks'
import { selectSortedNetWorths } from '../../../src/features/networth'
import { getDateLabels, prepareSeriesForTimeframe } from './networthUtils'

const greenShades = [
    '#9bc39d',
    '#2e7d32',
    '#388e3c',
    '#43a047',
    '#4caf50',
    '#66bb6a',
    '#81c784',
    '#a5d6a7',
    '#c8e6c9',
    '#e8f5e9',
    '#004d40',
    '#00796b',
    '#00897b',
    '#009688',
    '#26a69a',
    '#4db6ac',
    '#80cbc4',
    '#b2dfdb',
    '#e0f2f1',
    '#f1f8e9',
]
HighchartsAccessibility(Highcharts)
HighchartsExportData(Highcharts)

export interface AccountBalances {
    RRSP: number[]
    FHSA: number[]
    TFSA: number[]
    Brokerage: number[]
    NetWorth: number[]
}

export type TimeFrame = '1 Year' | '2 Weeks' | 'Now' | 'Future'

export const NetWorthChart = ({
    accountBalances,
    title,
    overrideTimeFrame,
    comparativeBalances,
    comparativeKey,
}: {
    accountBalances: AccountBalances
    title: string
    overrideTimeFrame?: TimeFrame
    comparativeBalances?: AccountBalances
    comparativeKey?: string
}) => {
    const historicalNetWorth = useAppSelector(selectSortedNetWorths)
    const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>(overrideTimeFrame ?? '2 Weeks')
    const currentSeries = prepareSeriesForTimeframe(
        selectedTimeframe,
        accountBalances,
        historicalNetWorth,
        comparativeBalances,
        comparativeKey
    )
    const comparativeSeries =
        comparativeBalances &&
        prepareSeriesForTimeframe(selectedTimeframe, comparativeBalances, historicalNetWorth, undefined, comparativeKey)
    return (
        <div>
            <div className="absolute right-5 z-999">
                {(overrideTimeFrame ? [overrideTimeFrame] : ['1 Year', '2 Weeks', 'Now', 'Future']).map(
                    (timeframe, index) => (
                        <button
                            className={(selectedTimeframe === timeframe ? 'text-primary' : '') + ' mr-1'}
                            key={timeframe}
                            onClick={() => setSelectedTimeframe(timeframe as typeof selectedTimeframe)}
                        >
                            {timeframe + (index === 3 ? '' : ',  ')}
                        </button>
                    )
                )}
            </div>
            <HighchartsReact
                highcharts={Highcharts}
                options={{
                    chart: {
                        type: 'area',
                    },
                    title: {
                        text: title,
                        align: 'left',
                    },
                    xAxis: {
                        title: {
                            text: 'Time Period',
                        },
                        categories: getDateLabels(selectedTimeframe, historicalNetWorth),
                    },
                    yAxis: {
                        title: {
                            text: 'Balance (CAD)',
                        },
                        labels: {
                            formatter: function () {
                                const value = (this as any).value
                                if (value >= 1e12) {
                                    return `$${(value / 1e12).toFixed(2)}T`
                                } else if (value >= 1e9) {
                                    return `$${(value / 1e9).toFixed(2)}B`
                                } else if (value >= 1e6) {
                                    return `$${(value / 1e6).toFixed(2)}M`
                                } else if (value >= 1e3) {
                                    return `$${(value / 1e3).toFixed(2)}K`
                                } else {
                                    return `$${value}`
                                }
                            },
                        },
                    },
                    tooltip: {
                        shared: true,
                        valuePrefix: '$',
                        valueDecimals: 2,
                    },
                    plotOptions: {
                        colors: greenShades,
                        area: {
                            stacking: 'normal',
                            lineColor: '#666666',
                            lineWidth: 1,
                            marker: {
                                enabled: false,
                            },
                        },
                        series: {
                            marker: {
                                enabled: false,
                            },
                        },
                    },
                    series: [
                        ...currentSeries.map((series) => ({
                            ...series,
                            name: `${series.name} (Current)`,
                        })),
                        ...(comparativeSeries
                            ? comparativeSeries.map((series) => ({
                                  ...series,
                                  name: `${series.name} (Budget Worth)`,
                              }))
                            : []),
                    ],
                }}
            />
        </div>
    )
}
