import React, { useState } from 'react'
import { View, Text, Button, ScrollView, Dimensions } from 'react-native'
import { WebView } from 'react-native-webview'
import { useAppSelector } from '../../../src/hooks'
import { selectSortedNetWorths } from '../../../src/features/networth'
import { getDateLabels, prepareSeriesForTimeframe } from './networthUtils'
import { darkTheme } from '../../../src/utils/darkTheme'
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
export interface AccountBalances {
    RRSP: number[]
    FHSA: number[]
    TFSA: number[]
    Brokerage: number[]
    NetWorth: number[]
}

export type TimeFrame = '1 Year' | '2 Weeks' | 'Now' | 'Future'

const screenWidth = Dimensions.get('window').width
const screenHeight = Dimensions.get('window').height

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
    console.info('render')
    const currentSeries = prepareSeriesForTimeframe(
        selectedTimeframe,
        accountBalances,
        historicalNetWorth,
        comparativeBalances,
        comparativeKey
    )

    const comparativeSeries =
        comparativeBalances && prepareSeriesForTimeframe(selectedTimeframe, comparativeBalances, historicalNetWorth)

    const labels = getDateLabels(selectedTimeframe, historicalNetWorth)

    const chartOptions = {
        chart: {
            type: 'line',
            height: Dimensions.get('screen').height * 0.8,
        },
        legend: {
            itemStyle: {
                fontSize: '20px', // Larger font size for legend items
                fontWeight: 'bold', // Optional: Make legend text bold
            },
        },
        title: {
            text: '',
            align: 'left',
            style: {
                fontSize: '24px', // Bigger font size for x-axis labels
                fontWeight: 'bold', // Optional: bold labels
            },
        },
        xAxis: {
            categories: labels,
            title: {
                text: 'Time Period',
                style: {
                    fontSize: '20px', // Bigger font size for x-axis labels
                    fontWeight: 'bold', // Optional: bold labels
                },
            },
            labels: {
                style: {
                    color: '#a5d6a7', // Light green for labels
                    fontSize: '20px', // Bigger font size for x-axis labels
                    fontWeight: 'bold', // Optional: bold labels
                },
            },
        },
        yAxis: {
            title: {
                text: 'Balance (CAD)',
                style: {
                    color: '#a5d6a7', // Light green for labels
                    fontSize: '24px', // Bigger font size for x-axis labels
                    fontWeight: 'bold', // Optional: bold labels
                },
            },
            labels: {
                style: {
                    fontSize: '20px', // Bigger font size for y-axis labels
                    fontWeight: 'bold', // Optional: bold labels
                },
            },
        },
        series: [
            ...currentSeries.map((series, index) => ({
                name: `${series.name} (Current)`,
                data: series.data,
                color: greenShades[index % greenShades.length],
            })),
            ...(comparativeSeries
                ? comparativeSeries.map((series, index) => ({
                      name: `${series.name} (Budget Worth)`,
                      data: series.data,
                      color: 'rgba(0, 0, 255, 0.5)', // Blue color for comparative series
                  }))
                : []),
        ],
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html style="width: 100vw; height: 100vh; background-color:rgb(18 32 17/var(--tw-bg-opacity));">
      <head>
        <script src="https://code.highcharts.com/highcharts.js"></script>
        <script src="https://code.highcharts.com/modules/exporting.js"></script>
        <script src="https://code.highcharts.com/modules/accessibility.js"></script>
      </head>
      <body style="background-color:rgb(18 32 17/var(--tw-bg-opacity));">
        <div id="container" style="background-color:rgb(18 32 17/var(--tw-bg-opacity));"></div>
        <script>
          document.addEventListener('DOMContentLoaded', function () {
            Highcharts.setOptions(${JSON.stringify(darkTheme)})
            Highcharts.chart('container', ${JSON.stringify(chartOptions)});
          });
        </script>
      </body>
    </html>
  `
    console.info('render2')

    return (
        <>
            <View
                className="bg-black flex-1"
                style={{ height: Dimensions.get('screen').height * 0.4, marginLeft: -15 }}
            >
                <View className="bg-black" style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}>
                    {(overrideTimeFrame ? [overrideTimeFrame] : ['1 Year', '2 Weeks', 'Now', 'Future']).map(
                        (timeframe) => (
                            <Button
                                title={timeframe}
                                color={selectedTimeframe === timeframe ? 'green' : 'gray'}
                                onPress={() => setSelectedTimeframe(timeframe as TimeFrame)}
                                key={timeframe}
                            />
                        )
                    )}
                </View>

                <WebView
                    originWhitelist={['*']}
                    source={{ html: htmlContent }}
                    style={{
                        height: screenHeight * 0.4,
                        width: screenWidth,
                        backgroundColor: 'transparent', // Ensures the WebView itself doesn't introduce a background
                    }}
                />
            </View>
        </>
    )
}
