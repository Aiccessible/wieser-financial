import React, { useState } from 'react'
import HighchartsReact from '../native/Chats'
import * as Highcharts from 'highcharts'
import HighchartsExportData from 'highcharts/modules/export-data'
import HighchartsAccessibility from 'highcharts/modules/accessibility'
// import './graph.css'
import { HighLevelTransactionCategory, SpendingSummary } from '../../../src/API'
import { Button, ButtonGroup } from '@aws-amplify/ui-react'
import { CustomTextBox } from './CustomTextBox'
HighchartsAccessibility(Highcharts)
HighchartsExportData(Highcharts)
interface Props {
    spending: SpendingSummary[]
    title: string
}

export const SpendingBarChart = (props: Props) => {
    const { spending } = props

    const categories = Object.keys(HighLevelTransactionCategory)
    const itemsPerPage = 2
    const [currentPage, setCurrentPage] = useState(1)

    // Get the paginated data
    const paginatedData = spending.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    const nextPage = () => {
        setCurrentPage(currentPage + 1)
    }

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1)
        }
    }
    console.log(categories)
    // Prepare series data for each month
    const seriesData = paginatedData.map((monthData) => {
        return {
            name: new Date((monthData as any)?.date).toUTCString(),
            data: categories.map((category) => (monthData?.spending as any)[category] || 0),
        }
    })
    console.log(seriesData)

    return (
        <div>
            <ButtonGroup style={{ marginTop: '10px', justifyContent: 'center', display: 'flex' }}>
                <Button onClick={prevPage} disabled={currentPage === 0}>
                    <CustomTextBox>Previous</CustomTextBox>
                </Button>
                <Button onClick={nextPage}>
                    <CustomTextBox>Next</CustomTextBox>
                </Button>
            </ButtonGroup>
            <div id="container" className={`max-w-[100%] flex flex-row`}>
                <HighchartsReact
                    highcharts={Highcharts}
                    options={
                        {
                            chart: {
                                type: 'column',
                                height: (4 / 3) * 60 + '%', // 16:9 ratio
                            },
                            title: {
                                text: 'Spending Distribution by Month and Category',
                            },
                            xAxis: {
                                categories: categories,
                                title: {
                                    text: 'Month / Category',
                                },
                            },
                            yAxis: {
                                min: 0,
                                title: {
                                    text: 'Amount Spent ($)',
                                },
                            },
                            series: seriesData,
                            tooltip: {
                                pointFormat: '{series.name}: <b>${point.y:.2f}</b>',
                            },
                            plotOptions: {
                                column: {
                                    grouping: true,
                                    dataLabels: {
                                        enabled: true,
                                        format: '${point.y:.2f}',
                                    },
                                },
                            },
                        } as Highcharts.Options
                    }
                />
            </div>
        </div>
    )
}
