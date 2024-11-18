import { Text } from 'react-native'
import { cssInterop } from 'nativewind'

const StyledText = cssInterop(Text, {
    className: 'style',
})
export const PercentChange = ({ changePercent }: { changePercent: string }) => (
    <StyledText className={`font-semibold ${parseFloat(changePercent) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
        {parseFloat(changePercent) >= 0 ? `+${changePercent}%` : `${changePercent}%`}
    </StyledText>
)
