import React from 'react'

const ScoreIndicator = ({ score, label, color }: { score: number; label: string; color: string }) => {
    return (
        <div className="text-center flex flex-col items-center justify-center">
            <div
                className={`w-12 h-12 flex items-center justify-center rounded-full border-4 ${color} dark:text-white text-md font-semibold`}
            >
                {score}
            </div>
            <p className={`${color} `}>{label}</p>
        </div>
    )
}

const ScoreIndicators = () => {
    return (
        <div className="flex flex-grow items-center justify-evenly gap-2 bg-gray-900">
            <ScoreIndicator score={96} label="Overall" color="border-highlight text-highlight" />
            <ScoreIndicator score={98} label="Income" color="border-highlight text-highlight" />
            <ScoreIndicator score={62} label="Spending" color="border-orange-500 text-orange-500" />
            <ScoreIndicator score={22} label="Debt" color="border-red-500 text-red-500" />
        </div>
    )
}

export default ScoreIndicators
