import React from 'react'
import { View, Text } from 'react-native'

const ScoreIndicator = ({ score, label, color }: { score: number; label: string; color: string }) => {
    return (
        <View className="text-center flex flex-col items-center justify-center">
            <View
                className={`w-12 h-12 rounded-full border-4 ${color} flex items-center justify-center`}
                style={{ borderColor: color, alignItems: 'center', justifyContent: 'center' }} // Add this if necessary
            >
                <Text style={{ color: color }} className="dark:text-white text-md font-semibold">
                    {score}
                </Text>
            </View>
            <Text style={{ color: color }} className={`text-${color} mt-2`}>
                {label}
            </Text>
        </View>
    )
}

const ScoreIndicators = () => {
    return (
        <View className="flex flex-row px-10 items-center justify-evenly gap-2 bg-gray-900">
            <ScoreIndicator score={96} label="Overall" color="#31e829" />
            <ScoreIndicator score={98} label="Income" color="#31e829" />
            <ScoreIndicator score={62} label="Spending" color="orange" />
            <ScoreIndicator score={22} label="Debt" color="red" />
        </View>
    )
}

export default ScoreIndicators
