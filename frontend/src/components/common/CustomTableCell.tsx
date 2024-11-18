import { TableCell } from '@aws-amplify/ui-react'
import { View } from 'react-native'

export const CustomTableCell = ({ children }: { children: React.ReactNode }) => (
    <View className="items-center justify-center p-2.5 xl:p-5 flex-1">{children}</View>
)
