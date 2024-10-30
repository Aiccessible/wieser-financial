import * as Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

import HighchartsExportData from 'highcharts/modules/export-data'
import HighchartsAccessibility from 'highcharts/modules/accessibility'
import HighchartsExporting from 'highcharts/modules/exporting'

HighchartsAccessibility(Highcharts)
HighchartsExportData(Highcharts)
HighchartsExporting(Highcharts)

export interface AccountBalances {
    RRSP: number[]
    FHSA: number[]
    TFSA: number[]
    Brokerage: number[]
    NetWorth: number[]
}

export const NetWorthChart = ({ accountBalances, title }: { accountBalances: AccountBalances; title: string }) => {
    const seriesData = Object.entries(accountBalances).map(([name, data]) => ({
        name,
        data,
        type: 'area', // or 'line' for line chart
        fillOpacity: name === 'Net Worth' ? 0.3 : 0.1, // Make Net Worth slightly more opaque
    }))

    return (
        <HighchartsReact
            highcharts={Highcharts}
            options={
                {
                    chart: {
                        type: 'area', // Use 'area' for filled areas; you can also use 'line'
                    },
                    title: {
                        text: 'Networth Projection',
                    },
                    xAxis: {
                        title: {
                            text: 'Years',
                        },
                        categories: Array.from({ length: 12 }, (_, i) => `Year ${i + 1}`),
                    },
                    yAxis: {
                        title: {
                            text: 'Balance (CAD)',
                        },
                        formatter: function () {
                            const value = (this as any).value
                            if (value >= 1e12) {
                                return `$${(value / 1e12).toFixed(2)}T` // Trillions
                            } else if (value >= 1e9) {
                                return `$${(value / 1e9).toFixed(2)}B` // Billions
                            } else if (value >= 1e6) {
                                return `$${(value / 1e6).toFixed(2)}M` // Millions
                            } else if (value >= 1e3) {
                                return `$${(value / 1e3).toFixed(2)}K` // Thousands
                            } else {
                                return `$${value}`
                            }
                        },
                    },
                    tooltip: {
                        shared: true,
                        valuePrefix: '$',
                        valueDecimals: 2,
                    },
                    plotOptions: {
                        area: {
                            stacking: 'normal', // Stack areas if desired
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
                    series: seriesData,
                } as Highcharts.Options
            }
        />
    )
}
