import { useEffect, useCallback } from 'react'
import { generateClient } from 'aws-amplify/api'
import { ConsoleLogger } from 'aws-amplify/utils'
import RefreshHoldings from './RefreshHoldings'
import { Holding, Investment as InvestmentType, Security } from '../../src/API'
import Investment from './Investment'
import Loader from '../components/common/Loader'
import { ScrollView, Text, View } from 'react-native'
import { CustomTextBox } from './common/CustomTextBox'
import { useAppDispatch, useAppSelector } from '../hooks'
import {
    getInvestementsAsync,
    getInvestmentAnalysis,
    getInvestmentNews,
    getInvestmentNewsSummary,
    setActiveStock,
} from '../features/investments'
import Markdown from '../components/native/Markdown'
import ExpandableTextWithModal from './ExpandableTextWithModal'
import StockOverlayComponent from './common/StockOverlayComponent'
import { getIdFromSecurity } from '../libs/utlis'
import { useDataLoading } from '../hooks/useDataLoading'
const ID_SEPERATOR = '-'
const logger = new ConsoleLogger('Holdings')

export interface InvestmentViewModel {
    security: Security | undefined
    holding: Holding
}

const PortfolioValue = ({ netWorth }: { netWorth: number }) => {
    return (
        <View className="bg-gray-800 p-1 rounded-lg text-white w-full">
            <CustomTextBox className="text-3xl font-bold mb-2">${netWorth.toFixed(2)}</CustomTextBox>
            <CustomTextBox className="text-green-400">+$11.33 / 0.25% today</CustomTextBox>
        </View>
    )
}

const NewsSection = ({ news }: { news: string | undefined }) => {
    if (!news) {
        return <CustomTextBox>Loading News Summary...</CustomTextBox>
    }
    return (
        <>
            <Text className="font-bold">My Investment Report</Text>
            <Markdown>{news}</Markdown>
        </>
    )
}

export const callFunctionsForEachId = async (func: any, ids: string[]) => {
    await Promise.all(
        ids.map((id) => {
            return func(id)
        })
    )
}

export default function Investments({}: {}) {
    const loading = useAppSelector((state) => state.investments.loading)

    const client = generateClient()
    const investments = useAppSelector((state) => state.investments.investments)
    const investmentSummary = useAppSelector((state) => state.investments.investmentSummary)
    const error = useAppSelector((state) => state.investments.error)
    const investmentKnoweldge = useAppSelector((state) => state.investments.investmentKnoweldge)
    const activeStock = useAppSelector((state) => state.investments.activeStock)
    const ids = useAppSelector((state) => state.idsSlice.institutions)
    useDataLoading({
        id: '',
        client: client,
    })
    const dispatch = useAppDispatch()
    useEffect(() => {
        const asyncFetch = async () => {
            if (!investmentSummary && investments) {
                getInvestmentNewsSummary({ client, ids: ids?.map((institution) => institution.item_id) ?? [] })
            }
        }
        asyncFetch()
    }, [investments, investmentSummary])
    const getInvestments = async () => {
        try {
            await dispatch(getInvestementsAsync({ client, id: 'v0', append: false }))
        } catch (err) {
            logger.error('unable to get transactions', err)
        }
    }

    const getId = (el: InvestmentType) => el.account_id + ID_SEPERATOR + el.security_id
    const getIdToSecurityAndHolding = useCallback(() => {
        const accountAndsecurityIdToEntity: Record<string, { security: Security | undefined; holding: Holding }> = {}
        investments?.forEach((el) => {
            if (el.plaid_type === 'Holding') {
                accountAndsecurityIdToEntity[getId(el)] = {
                    security: investments?.find(
                        (sec) => sec.plaid_type === 'Security' && sec.security_id === el.security_id
                    ) as Security | undefined,
                    holding: el as Holding,
                }
            }
        })
        return Object.values(accountAndsecurityIdToEntity).sort(
            (el) => (el.holding?.quantity ?? 0) * (el?.security?.close_price ?? 0)
        )
    }, [investments])

    useEffect(() => {
        if (investments) {
            const accountAndsecurityIdToEntity = getIdToSecurityAndHolding()
            const fetchingAnalaysisAndNews = async () => {
                // Convert object values to an array
                const entities = Object.values(accountAndsecurityIdToEntity)
                const batchSize = 5

                // Function to process a batch of entities
                const processBatch = async (batch: typeof entities) => {
                    await Promise.all(
                        batch.map(async (el) => {
                            await dispatch(
                                getInvestmentAnalysis({
                                    security: el?.security,
                                    client,
                                })
                            )
                            await dispatch(
                                getInvestmentNews({
                                    security: el?.security,
                                    client,
                                })
                            )
                        })
                    )
                }

                // Process entities in batches of 5
                for (let i = 0; i < entities.length; i += batchSize) {
                    const batch = entities.slice(i, i + batchSize)
                    await processBatch(batch)
                    return
                }
            }

            fetchingAnalaysisAndNews()
        }
    }, [investments, getIdToSecurityAndHolding])

    const getNetWorth = (holdings: { security: Security | undefined; holding: Holding }[]) => {
        return holdings.reduce((val, holding) => {
            return val + (holding.holding.quantity ?? 0) * (holding.security?.close_price ?? 0)
        }, 0)
    }

    useEffect(() => {
        ids && getInvestments()
    }, [ids])

    const holdingsAndSecuritiesJoined = Object.values(getIdToSecurityAndHolding()).filter((entity) => entity.security)
    return (
        <View className="rounded-sm flex-1  bg-black px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            {error && <Text className="text-red-500">{error}</Text>}
            {activeStock && (
                <StockOverlayComponent activeStock={activeStock} onClose={() => dispatch(setActiveStock(undefined))} />
            )}
            <View className="grid grid-cols-4 gap-6 p-1">
                {/* Left Section (Portfolio Value) */}
                <View className="col-span-1">
                    <Text className="font-bold text-white">Investments</Text>
                    <PortfolioValue netWorth={getNetWorth(getIdToSecurityAndHolding())} />
                </View>

                {/* Middle Section (Relevant News) */}
                <View className="col-span-2">
                    <ExpandableTextWithModal maxHeight="20rem">
                        <NewsSection news={investmentSummary} />
                    </ExpandableTextWithModal>
                </View>
                <View className="col-span-1">
                    <RefreshHoldings item_id={'v0'} />
                </View>
            </View>
            <ScrollView className="flex-grow flex-col  bg-gray-900 rounded-lg m-4">
                <View className="flex-row bg-gray-800 p-4 border-b border-gray-700">
                    <Text className="flex-1 font-bold text-white">Name</Text>
                    <Text className="flex-1 font-bold text-white">Last Close Price</Text>
                    <Text className="flex-1 font-bold text-white">Quantity</Text>
                    <Text className="flex-1 font-bold text-white">Cost</Text>
                </View>
                {loading ? (
                    <Loader />
                ) : holdingsAndSecuritiesJoined.length ? (
                    holdingsAndSecuritiesJoined.map((investmentViewModel) => {
                        return (
                            <Investment
                                knoweldge={investmentKnoweldge[getIdFromSecurity(investmentViewModel?.security)]}
                                investment={investmentViewModel}
                            />
                        )
                    })
                ) : (
                    <></>
                )}
            </ScrollView>
        </View>
    )
}
