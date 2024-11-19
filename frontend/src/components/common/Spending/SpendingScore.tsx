import React from 'react'

interface ScoreReviewProps {
    score: number
    change: number // Change in the last 30 days (percentage)
    spendingChange: number // Amount to cut spending by
    avgSpending: number // Average spending in demographic
    percentile: number // Percentile for responsible spending
}

const ScoreReview: React.FC<ScoreReviewProps> = ({ score, change, spendingChange, avgSpending, percentile }) => {
    return (
        <div className="bg-gray-900 text-white p-6 rounded-lg ">
            <h2 className="text-lg font-bold mb-4">Wieser Spending Score Review</h2>

            {/* Score Section */}
            <div className="flex flex-row">
                <div className="flex mr-4 space-x-4">
                    <div className="relative flex justify-center items-center w-20 h-20 rounded-full border-4 border-orange-500">
                        <span className="text-3xl font-bold">{score}</span>
                    </div>
                </div>

                {/* Reviews */}
                <ul className="mt-4 space-y-3">
                    <li>
                        • Your spending habits have recently improved, but you are still not on track to reach your
                        defined goals. You need to cut spending by{' '}
                        <span className="text-red-500">${spendingChange}</span> / month to get back on track.
                    </li>
                    <li>
                        • The average spending for people in your demographic is{' '}
                        <span className="text-blue-400">${avgSpending}</span> / month. You are in the{' '}
                        <span className="text-green-400">{percentile}th percentile</span> of your demographic for most
                        responsible spending.
                    </li>
                    <li>
                        • Your spending is well distributed across your credit cards to maximize rewards. Continue to
                        make sure all credit card balances are maintained at zero, as credit card debt is the number one
                        source of financial trouble across your demographic.
                    </li>
                </ul>
            </div>
        </div>
    )
}

export default ScoreReview
