import React from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { BudgetPlan } from '../API'
import { formatter } from './BudgetsFormatter'

const BudgetComparison = ({
    budgets,
    averageSpending,
    isRecommended,
}: {
    budgets: BudgetPlan[]
    averageSpending: Record<any, any>
    isRecommended: boolean
}) => {
    const categories = budgets.map((budget) => budget.highLevelCategory || 'Category')
    const currentSpendingData = budgets.map((budget) => averageSpending[budget.highLevelCategory ?? ''] || 0)
    const spendingThresholdData = budgets.map((budget) => budget.spendingThreshold || 0)
    const options = {
        chart: {
            type: 'bar', // Horizontal bars
        },
        title: {
            text: '',
        },

        xAxis: {
            categories, // Categories are the high-level budget categories
            title: {
                text: null,
            },
            labels: {
                useHTML: true, // Enables HTML for custom styling
                formatter: formatter,
            },
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Amount ($)',
                align: 'high',
            },
            labels: {
                overflow: 'justify',
            },
        },
        tooltip: {
            valuePrefix: '$',
        },
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: true,
                },
            },
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'top',
            x: 0,
            y: 20,
            floating: true,
            borderWidth: 1,
            backgroundColor: '#122011',
            shadow: true,
        },
        credits: {
            enabled: false,
        },
        series: [
            {
                name: 'Current Spending',
                data: currentSpendingData,
                color: '#244424', // Blue color
            },
            {
                name: isRecommended ? 'Proposed Budget' : 'Current Budget',
                data: spendingThresholdData,
                color: '#d3fc82', // Green color
            },
        ],
    }

    return (
        <div>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    )
}

export default BudgetComparison
