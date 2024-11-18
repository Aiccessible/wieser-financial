import { EyeIcon, EyeOffIcon } from 'lucide-react-native'
import { useAppDispatch, useAppSelector } from '../hooks'
import { setBalancesVisible } from '../features/auth'
import { CustomTextBox } from '../components/common/CustomTextBox'
import { TouchableOpacity, View } from 'react-native'

const BalanceVisibilitySwitcher = () => {
    const balancesVisible = useAppSelector((state) => state.auth.balancesVisible)

    const dispatch = useAppDispatch()
    return (
        <View style={{ margin: 0, alignItems: 'center', display: 'flex', justifyContent: 'center' }}>
            <TouchableOpacity
                onPress={() => dispatch(setBalancesVisible(!balancesVisible))}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {balancesVisible ? (
                    <EyeIcon className="text-black dark:text-white" />
                ) : (
                    <EyeOffIcon className="text-black dark:text-white" />
                )}
            </TouchableOpacity>
        </View>
    )
}

export default BalanceVisibilitySwitcher
