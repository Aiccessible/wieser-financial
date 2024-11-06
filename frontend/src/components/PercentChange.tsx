export const PercentChange = ({ changePercent }: { changePercent: string }) => (
    <span className={`font-semibold ${parseFloat(changePercent) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
        {parseFloat(changePercent) >= 0 ? `+${changePercent}%` : `${changePercent}%`}
    </span>
)
