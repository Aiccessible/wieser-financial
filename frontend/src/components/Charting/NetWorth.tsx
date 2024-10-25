import React from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Title } from 'chart.js'

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title)

const NetWorthChart: React.FC = () => {
    const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Net Worth',
                data: [5000, 10000, 12000, 15000, 18000, 20000],
                borderColor: 'yellow',
                backgroundColor: 'rgba(255, 255, 0, 0.3)',
                fill: true,
                tension: 0.3,
            },
        ],
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    }

    return (
        <div className="flex flex-col  w-full">
            <h3 className="text-lg text-white mb-4">Net Worth</h3>
            <div className="h-52 w-full">
                <Line data={data} options={options} />
            </div>
        </div>
    )
}

export default NetWorthChart
