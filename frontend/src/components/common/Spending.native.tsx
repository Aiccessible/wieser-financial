import React from 'react'
import { useAppDispatch, useAppSelector } from '../../hooks'
import { WebView } from 'react-native-webview'
import { ChatFocus } from '../../../src/API'
import { setChatParams } from '../../../src/features/chat'
import { darkTheme } from '../../../src/utils/darkTheme'
import { Dimensions, ScrollView } from 'react-native'

interface Props {
    spending: Record<string, number>
    title: string
    dateRange: [number?, number?]
    isIncomeAndTransfers?: boolean
}

export const greenShades = [
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

export const Spending = (props: Props) => {
    const { spending, title, dateRange, isIncomeAndTransfers } = props
    const spendingData = Object.entries(spending || {})
        .filter(([category]) =>
            isIncomeAndTransfers
                ? category.startsWith('INCOME') ||
                  category.startsWith('TRANSFER_IN') ||
                  category.startsWith('TRANSFER_OUT')
                : !category.startsWith('INCOME') &&
                  !category.startsWith('TRANSFER_IN') &&
                  !category.startsWith('TRANSFER_OUT')
        )
        .map(([category, value]) => ({
            name: category,
            y: value,
        }))

    const total = spendingData.reduce((acc, newVal) => acc + newVal.y, 0)
    const areBalancesVisible = useAppSelector((state) => state.auth.balancesVisible)
    const dispatch = useAppDispatch()

    const chartHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <script src="https://code.highcharts.com/highcharts.js"></script>
            <script src="https://code.highcharts.com/modules/export-data.js"></script>
            <script src="https://code.highcharts.com/modules/accessibility.js"></script>
        </head>
        <body>
            <div id="container" style="width:100%; height:100%;"></div>
            <script>
                document.addEventListener('message', function(event) {
                    const data = JSON.parse(event.data);
                    window.ReactNativeWebView.postMessage(data.name);
                });
                Highcharts.setOptions(${JSON.stringify(darkTheme)})
                Highcharts.chart('container', {
                    chart: {
                        plotBackgroundColor: undefined,
                        plotBorderWidth: undefined,
                        plotShadow: false,
                        type: 'pie',
                        height: ${Dimensions.get('screen').height * 0.8}
                    },
                    title: {
                        text: '${title}',
                        align: 'left',
                         style: {
                            fontSize: '36px', // Adjust the size as needed
                            fontWeight: 'bold', // Optional: Make the title bold
                        },
                    },
                    subtitle: {
                        text: 'Total: ${total}$',
                        align: 'left',
                    },
                    tooltip: {
                        pointFormat: ${
                            areBalancesVisible
                                ? "'{series.name}: <b>{point.y:.1f}$</b>'"
                                : "'{series.name}: <b>***$</b>'"
                        },
                    },
                    accessibility: {
                        point: {
                            valueSuffix: '$',
                        },
                    },
                    plotOptions: {
                        pie: {
                            allowPointSelect: true,
                            cursor: 'pointer',
                            dataLabels: {
                                enabled: true,
                                format:
                                    '<span style="font-size: 1.2em"><b>{point.name}</b></span><br>' +
                                    ${
                                        areBalancesVisible
                                            ? '\'<span style="opacity: 0.6">{point.y:.1f} $</span>\''
                                            : '\'<span style="opacity: 0.6">*** $</span>\''
                                    },
                                connectorColor: 'rgba(128,128,128,0.5)',
                                 style: {
                                    fontSize: '20px', // Adjust label size
                                    fontWeight: 'bold', // Optional: bold labels
                                    color: '#ffffff', // Optional: adjust label color if needed
                                },
                            },
                            colors: ${JSON.stringify(greenShades)},
                            point: {
                                events: {
                                    click: function(event) {
                                        const point = { name: event.point.name };
                                        window.ReactNativeWebView.postMessage(JSON.stringify(point));
                                    },
                                },
                            },
                        },
                    },
                    series: [
                        {
                            name: 'Spending',
                            data: ${JSON.stringify(spendingData)},
                        },
                    ],
                });
            </script>
        </body>
        </html>
    `

    const handleWebViewMessage = (event: any) => {
        const categoryName = event.nativeEvent.data
        dispatch(
            setChatParams({
                scope: ChatFocus.Transaction,
                highLevelTransactionCategory: JSON.parse(categoryName).name,
                dateRange: dateRange,
            })
        )
    }

    return (
        <ScrollView
            style={{ height: Dimensions.get('window').height * 0.4, width: Dimensions.get('window').width * 0.85 }}
        >
            <WebView
                originWhitelist={['*']}
                source={{ html: chartHtml }}
                onMessage={handleWebViewMessage}
                style={{
                    height: Dimensions.get('window').height * 0.4,
                    width: Dimensions.get('window').width * 0.95,
                    backgroundColor: 'transparent',
                }}
            />
        </ScrollView>
    )
}
