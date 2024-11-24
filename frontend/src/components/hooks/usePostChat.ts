import { useAppDispatch, useAppSelector } from '../../../src/hooks'
import { sendChatToLLM, setIsChatOpen, setNewChatVal } from '../../../src/features/chat'
import { generateClient } from 'aws-amplify/api'
import { ChatFocus } from '../../../src/API'
import { useDefaultValuesForProjection } from '../hooks/useDefaultValuesForProjection'
import { getFinancialSimulationExpansionThunk, setActiveSimulationName } from '../../../src/features/analysis'
import { useLocation } from 'react-router-dom'
const usePostChat = () => {
    const dispatch = useAppDispatch()
    const client = generateClient()
    const projection = useDefaultValuesForProjection({})
    const activeSimulationKey = useAppSelector((state) => state.analysis.activeSimulationKey)
    const accounts = useAppSelector((state) => state.accounts.accounts)
    const activeSimulationName = useAppSelector((state) => state.analysis.activeSimulationName)
    const location = useLocation() // Access the current route
    let activeTab = location.pathname.includes('analyze') ? 'Plan' : 'unknown'

    const postChat = (prompt: string) => {
        if (activeSimulationName === undefined) {
            dispatch(setActiveSimulationName(prompt))
        }
        if (activeTab === 'Plan') {
            dispatch(
                getFinancialSimulationExpansionThunk({
                    client: client,
                    input: {
                        message: prompt,
                        s3Key: activeSimulationKey,
                    },
                })
            )
            dispatch(setNewChatVal(''))
        } else {
            dispatch(setIsChatOpen(true))
            dispatch(
                sendChatToLLM({
                    newChat: prompt,
                    client,
                    focus: ChatFocus.All,
                    ids: accounts?.map((el) => el.account_id) ?? [],
                    highLevelSpendingCategory: undefined,
                    currentDateRange: undefined,
                    projection,
                })
            )
        }
    }
    return { postChat }
}

export { usePostChat }
