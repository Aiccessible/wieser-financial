import React, { useState } from 'react'
import * as Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

import HighchartsExportData from 'highcharts/modules/export-data'
import HighchartsAccessibility from 'highcharts/modules/accessibility'
import HighchartsExporting from 'highcharts/modules/exporting'
import { useAppSelector } from '../../../src/hooks'
import { selectSortedNetWorths } from '../../../src/features/networth'
import { greenShades } from '../common/Spending'

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
    console.log(accountBalances, comparativeBalances)
    const historicalNetWorth = useAppSelector(selectSortedNetWorths)
    const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>(overrideTimeFrame ?? '2 Weeks')

    const prepareSeriesForTimeframe = (timeframe: string, accountBalances: AccountBalances) => {
        const fhsas = historicalNetWorth.map((el) => parseFloat(el.fhsaNetWorth ?? ''))
        const rrsp = historicalNetWorth.map((el) => parseFloat(el.rrspNetWorth ?? ''))
        const tfsa = historicalNetWorth.map((el) => parseFloat(el.tfsaNetWorth ?? ''))
        const netWorth = historicalNetWorth.map((el) => parseFloat(el.netWorth ?? ''))

        switch (timeframe) {
            case '1 Year':
                return [
                    { name: 'FHSA Net Worth (1 Year)', data: [], type: 'area', color: greenShades[0] },
                    { name: 'RRSP Net Worth (1 Year)', data: [], type: 'area', color: greenShades[1] },
                    { name: 'TFSA Net Worth (1 Year)', data: [], type: 'area', color: greenShades[2] },
                    { name: 'Net Worth (1 Year)', data: [], fillOpacity: 0.3, color: greenShades[3] },
                ]
            case '2 Weeks':
                return [
                    { name: 'FHSA Net Worth (2 Weeks)', data: fhsas, type: 'area', color: greenShades[0] },
                    { name: 'RRSP Net Worth (2 Weeks)', data: rrsp, type: 'area', color: greenShades[1] },
                    { name: 'TFSA Net Worth (2 Weeks)', data: tfsa, type: 'area', color: greenShades[0] },
                    { name: 'Net Worth (2 Weeks)', data: netWorth, fillOpacity: 0.3, color: greenShades[2] },
                ]
            case 'Now':
                return [
                    { name: 'FHSA Net Worth (Now)', data: [fhsas.at(-1)], type: 'area', color: greenShades[0] },
                    { name: 'RRSP Net Worth (Now)', data: [rrsp.at(-1)], type: 'area', color: greenShades[1] },
                    { name: 'TFSA Net Worth (Now)', data: [tfsa.at(-1)], type: 'area', color: greenShades[2] },
                    { name: 'Net Worth (Now)', data: [netWorth.at(-1)], fillOpacity: 0.3, color: greenShades[3] },
                ]
            case 'Future':
                const entries = Object.entries(accountBalances)
                const compareData =
                    comparativeBalances && comparativeKey
                        ? entries.filter((entry) => entry[0] === comparativeKey)
                        : entries
                return compareData.map(([name, data], index) => ({
                    name: `${name} (Future)`,
                    data,
                    type: 'area',
                    fillOpacity: name === 'Net Worth' ? 0.3 : 0.1,
                    color: greenShades[index % greenShades.length],
                }))
            default:
                return []
        }
    }

    const getDateLabels = (timeframe: string) => {
        switch (timeframe) {
            case '1 Year':
            case '2 Weeks':
                return historicalNetWorth.map((el) => new Date(el?.sk ?? 0).toDateString())
            case 'Now':
                return []
            case 'Future':
                return Array.from({ length: 12 }, (_, i) => `Year ${i + 1}`)
            default:
                return []
        }
    }
    const currentSeries = prepareSeriesForTimeframe(selectedTimeframe, accountBalances)
    const comparativeSeries = comparativeBalances && prepareSeriesForTimeframe(selectedTimeframe, comparativeBalances)
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
                        categories: getDateLabels(selectedTimeframe),
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
