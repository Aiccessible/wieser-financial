import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../hooks'
import { setBalancesVisible } from '../features/auth'
import { CustomTextBox } from '../components/common/Custom/CustomTextBox'

const BalanceVisibilitySwitcher = () => {
    const balancesVisible = useAppSelector((state) => state.auth.balancesVisible)

    const dispatch = useAppDispatch()
    return (
        <li>
            <label
                className="relative m-0 flex items-center cursor-pointer text-black dark:text-white"
                onClick={() => dispatch(setBalancesVisible(!balancesVisible))}
            >
                {balancesVisible ? (
                    <EyeIcon className="text-black dark:text-white" />
                ) : (
                    <EyeOffIcon className="text-black dark:text-white" />
                )}
            </label>
        </li>
    )
}

export default BalanceVisibilitySwitcher
