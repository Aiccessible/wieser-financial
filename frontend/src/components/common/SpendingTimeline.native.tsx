import React from 'react'
import { ScrollView, Dimensions } from 'react-native'
import { WebView } from 'react-native-webview'
import { SpendingSummary } from '@/src/API'
import { calculateTotalSpendingInCategoriesAsTotal } from './spendingUtils'
import { darkTheme } from '../../../src/utils/darkTheme'

interface Props {
    spending: SpendingSummary[]
    title: string
    isIncomeAndTransfers?: boolean
}

export const SpendingTimeline = (props: Props) => {
    const { spending } = props

    // Sort and prepare data
    const copy = [...spending]
    copy.sort((el: any, el2: any) => el.date - el2.date)

    const spendingData = copy.map((spending) => ({
        name: new Date((spending as any).date).toDateString(),
        y: calculateTotalSpendingInCategoriesAsTotal(spending),
    }))

    const chartOptions = {
        chart: {
            type: 'spline', // Smooth line chart
            plotBackgroundColor: undefined,
        },
        title: {
            text: 'Average Spending', // Title
            align: 'left',
            style: {
                fontSize: '48px', // Adjust the size as needed
                fontWeight: 'bold', // Optional: Make the title bold
            },
        },
        xAxis: {
            categories: spendingData.map((data) => data.name),
            lineColor: 'transparent',
            tickColor: 'transparent',
            labels: {
                style: {
                    color: '#a5d6a7', // Light green for labels
                    fontSize: '24px', // Bigger font size for x-axis labels
                    fontWeight: 'bold', // Optional: bold labels
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
                    enabled: true,
                    radius: 6,
                    fillColor: '#ffffff', // White marker
                    lineWidth: 2,
                    lineColor: '#a5d6a7', // Border around markers
                },
            },
        },
        series: [
            {
                name: 'Spending',
                data: spendingData.map((data) => data.y),
                color: '#a5d6a7', // Smooth light green line
                type: 'line',
            },
        ],
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://code.highcharts.com/highcharts.js"></script>
        <script src="https://code.highcharts.com/modules/exporting.js"></script>
        <script src="https://code.highcharts.com/modules/accessibility.js"></script>
      </head>
      <body>
        <div id="container" style="width: 100%; height: 100%;"></div>
        <script>
          document.addEventListener('DOMContentLoaded', function () {
            Highcharts.setOptions(${JSON.stringify(darkTheme)});
            Highcharts.chart('container', ${JSON.stringify(chartOptions)});
          });
        </script>
      </body>
    </html>
  `

    return (
        <ScrollView
            style={{ height: Dimensions.get('window').height * 0.2, width: Dimensions.get('window').width * 0.9 }}
        >
            <WebView
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                style={{
                    height: Dimensions.get('window').height * 0.2,
                    width: Dimensions.get('window').width * 0.9,
                    backgroundColor: 'transparent',
                }}
                javaScriptEnabled
                domStorageEnabled
            />
        </ScrollView>
    )
}
