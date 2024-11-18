import React from 'react'
import { Text, View } from 'react-native'

interface ScoreReviewProps {
    score: number
    change: number // Change in the last 30 days (percentage)
    spendingChange: number // Amount to cut spending by
    avgSpending: number // Average spending in demographic
    percentile: number // Percentile for responsible spending
}

const ScoreReview: React.FC<ScoreReviewProps> = ({ score, change, spendingChange, avgSpending, percentile }) => {
    return (
        <View className="bg-gray-900 text-white p-6 rounded-lg mt-10 mx-4">
            <Text className="text-lg font-bold mb-4 text-white">Wieser Spending Score Review</Text>

            {/* Score Section */}
            <View className="flex flex-row items-center">
                <View className="mr-4">
                    <View className="flex justify-center items-center w-20 h-20 rounded-full border-4 border-orange-500">
                        <Text className="text-3xl font-bold text-white">{score}</Text>
                    </View>
                </View>

                {/* Reviews */}
                <View className="flex-1">
                    <Text className="text-white mb-3">
                        • Your spending habits have recently improved, but you are still not on track to reach your
                        defined goals. You need to cut spending by{' '}
                        <Text className="text-red-500">${spendingChange}</Text> / month to get back on track.
                    </Text>
                    <Text className="text-white mb-3">
                        • The average spending for people in your demographic is{' '}
                        <Text className="text-blue-400">${avgSpending}</Text> / month. You are in the{' '}
                        <Text className="text-green-400">{percentile}th percentile</Text> of your demographic for most
                        responsible spending.
                    </Text>
                    <Text className="text-white">
                        • Your spending is well distributed across your credit cards to maximize rewards. Continue to
                        make sure all credit card balances are maintained at zero, as credit card debt is the number one
                        source of financial trouble across your demographic.
                    </Text>
                </View>
            </View>
        </View>
    )
}

export default ScoreReview
