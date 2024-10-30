import React, { useEffect, useRef } from 'react'
import { CustomTextBox } from './CustomTextBox'
import { Button, Heading } from '@aws-amplify/ui-react'
import { useAppSelector } from '../../hooks'
import HighchartsReact from 'highcharts-react-official'
import * as Highcharts from 'highcharts'
import HighchartsExportData from 'highcharts/modules/export-data'
import HighchartsAccessibility from 'highcharts/modules/accessibility'
import HighchartsExporting from 'highcharts/modules/exporting'
import { renderToStaticMarkup } from 'react-dom/server'

import './graph.css'
import { SpendingSummary } from '@/src/API'
HighchartsAccessibility(Highcharts)
HighchartsExportData(Highcharts)
HighchartsExporting(Highcharts)
interface Props {
    spending: Record<string, number>
    title: string
}

export const Spending = (props: Props) => {
    const { spending, title } = props
    const spendingData = Object.entries(spending || {}).map(([category, value]) => ({
        name: category,
        y: value,
    }))
    return (
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
                        text: title,
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
    )
}
