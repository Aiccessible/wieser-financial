import { cssInterop } from 'nativewind'
import { Text } from 'react-native'
const StyledText = cssInterop(Text, {
    className: 'style',
})
export const CustomTextBox = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <StyledText className={`text-white ${className ?? ''} `}>{children}</StyledText>
)
