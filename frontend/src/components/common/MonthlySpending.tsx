import React, { useRef } from 'react'
import { CustomTextBox } from './CustomTextBox'
import { Button, Heading } from '@aws-amplify/ui-react'
import { useAppSelector } from '../../hooks'
import HighchartsReact from 'highcharts-react-official'
import * as Highcharts from 'highcharts'
import HighchartsExportData from 'highcharts/modules/export-data'
import HighchartsAccessibility from 'highcharts/modules/accessibility'
import HighchartsExporting from 'highcharts/modules/exporting'
import './graph.css'
HighchartsAccessibility(Highcharts)
HighchartsExportData(Highcharts)
HighchartsExporting(Highcharts)
interface Props {
    width: number
}
try {
    Highcharts.setOptions({
        colors: Highcharts.map(Highcharts.getOptions().colors ?? [], function (color: any) {
            return {
                radialGradient: {
                    cx: 0.5,
                    cy: 0.3,
                    r: 0.7,
                },
                stops: [
                    [0, color],
                    [1, Highcharts.color(color).brighten(-0.3).get('rgb')], // darken
                ],
            }
        }),
    })
} catch (e) {
    console.error('No colors')
}
export const MonthlySpending: React.FC<Props> = ({ width }) => {
    const monthlySpending = useAppSelector((state) => state.transactions.monthlySummaries)
    const spendingData = Object.entries(monthlySpending?.[0]?.spending || {}).map(([category, value]) => ({
        name: category,
        y: value,
    }))
    try {
        return (
            <div id="container" className={`max-w-[${width}%]`}>
                <HighchartsReact
                    highcharts={Highcharts}
                    options={
                        {
                            chart: {
                                plotBackgroundColor: undefined,
                                plotBorderWidth: undefined,
                                plotShadow: false,
                                type: 'pie',
                            },
                            title: {
                                text: 'Monthly spending',
                                align: 'left',
                            },
                            tooltip: {
                                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>',
                            },
                            accessibility: {
                                point: {
                                    valueSuffix: '%',
                                },
                            },
                            plotOptions: {
                                pie: {
                                    allowPointSelect: true,
                                    cursor: 'pointer',
                                    dataLabels: {
                                        enabled: true,
                                        format:
                                            '<span style="font-size: 1.2em"><b>{point.name}</b>' +
                                            '</span><br>' +
                                            '<span style="opacity: 0.6">{point.percentage:.1f} ' +
                                            '%</span>',
                                        connectorColor: 'rgba(128,128,128,0.5)',
                                    },
                                },
                            },
                            series: [
                                {
                                    name: 'Spending',
                                    data: spendingData,
                                },
                            ],
                        } as Highcharts.Options
                    }
                />
            </div>
        )
    } catch (e) {
        return <></>
    }
}
