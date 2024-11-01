import React, { useEffect, useRef } from 'react'
import { CustomTextBox } from './CustomTextBox'
import { Button, Heading } from '@aws-amplify/ui-react'
import { useAppDispatch, useAppSelector } from '../../hooks'
import HighchartsReact from 'highcharts-react-official'
import * as Highcharts from 'highcharts'
import HighchartsExportData from 'highcharts/modules/export-data'
import HighchartsAccessibility from 'highcharts/modules/accessibility'
import HighchartsExporting from 'highcharts/modules/exporting'
import { renderToStaticMarkup } from 'react-dom/server'

import './graph.css'
import { ChatFocus, SpendingSummary } from '../../../src/API'
import { setChatParams } from '../../../src/features/chat'
HighchartsAccessibility(Highcharts)
HighchartsExportData(Highcharts)
interface Props {
    spending: Record<string, number>
    title: string
    dateRange: [number?, number?]
}

export const Spending = (props: Props) => {
    const { spending, title, dateRange } = props
    const spendingData = Object.entries(spending || {}).map(([category, value]) => ({
        name: category,
        y: value,
    }))
    const areBalancesVisible = useAppSelector((state) => state.auth.balancesVisible)
    const dispatch = useAppDispatch()
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
                        pointFormat: areBalancesVisible
                            ? '{series.name}: <b>{point.y:.1f}$</b>'
                            : '{series.name}: <b>***$</b>',
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
                                    '<span style="font-size: 1.2em"><b>{point.name}</b>' +
                                    '</span><br>' +
                                    (areBalancesVisible
                                        ? '<span style="opacity: 0.6">{point.y:.1f} '
                                        : '<span style="opacity: 0.6">*** ') +
                                    '$</span>',
                                connectorColor: 'rgba(128,128,128,0.5)',
                            },
                            point: {
                                events: {
                                    click: (e) => {
                                        dispatch(
                                            setChatParams({
                                                scope: ChatFocus.Transaction,
                                                highLevelTransactionCategory: e.point.name,
                                                dateRange: dateRange,
                                            })
                                        )
                                    },
                                },
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
